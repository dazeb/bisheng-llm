from typing import List, Optional, Any

from langchain_core.messages import BaseMessage
from langchain_core.outputs import ChatResult
from loguru import logger
from pydantic import Field
from langchain_core.callbacks import AsyncCallbackManagerForLLMRun
from langchain_core.language_models import BaseLanguageModel, BaseChatModel

from bisheng.database.models.llm_server import LLMDao, LLMModelType, LLMServerType, LLMModel, LLMServer
from bisheng.interface.importing import import_by_type
from bisheng.interface.initialize.loading import instantiate_llm


class BishengLLM(BaseChatModel):
    """
     依赖bisheng后端服务的llm组件
     根据model的类型不同 调用不同的llm
    """

    model_id: int = Field(description="后端服务保存的model唯一ID")
    model_name: Optional[str] = Field(default='', description="后端服务保存的model名称")
    streaming: bool = Field(default=True, description="是否使用流式输出", alias="stream")
    temperature: float = Field(default=0.3, description="模型生成的温度")
    top_p: float = Field(default=1, description="模型生成的top_p")
    cache: bool = Field(default=True, description="是否使用缓存")

    llm: Optional[BaseChatModel] = Field(default=None)
    llm_node_type = {
        # 开源推理框架
        LLMServerType.OLLAMA: 'Ollama',
        LLMServerType.XINFERENCE: 'Xinference',
        LLMServerType.LLAMACPP: 'LlamaCpp',  # 此组件是加载本地的模型文件，待确认是否有api服务提供
        LLMServerType.VLLM: 'VLLMOpenAI',

        # 官方api服务
        LLMServerType.OPENAI: 'ChatOpenAI',
        LLMServerType.AZURE_OPENAI: 'AzureChatOpenAI',
        LLMServerType.QWEN: 'ChatOpenAI',
        LLMServerType.QIAN_FAN: 'ChatWenxin',
        LLMServerType.ZHIPU: 'ChatOpenAI',
        LLMServerType.MINIMAX: 'MiniMaxChat',
        LLMServerType.ANTHROPIC: 'ChatAnthropic',
        LLMServerType.DEEPSEEK: 'ChatOpenAI',
        LLMServerType.SPARK: 'ChatOpenAI',
    }

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.model_id = kwargs.get('model_id')
        self.model_name = kwargs.get('model_name')
        # 是否忽略模型是否上线的检查
        ignore_online = kwargs.get('ignore_online', False)

        if not self.model_id:
            raise Exception('没有找到llm模型配置')
        model_info = LLMDao.get_model_by_id(self.model_id)
        if not model_info:
            raise Exception('llm模型配置已被删除，请重新配置模型')
        self.model_name = model_info.model_name
        server_info = LLMDao.get_server_by_id(model_info.server_id)
        if not server_info:
            raise Exception('服务提供方配置已被删除，请重新配置llm模型')
        if model_info.model_type != LLMModelType.LLM.value:
            raise Exception(f'只支持LLM类型的模型，不支持{model_info.model_type}类型的模型')
        if not ignore_online and not model_info.online:
            raise Exception(f'{server_info.name}下的{model_info.model_name}模型已下线，请联系管理员上线对应的模型')
        logger.debug(f'init_bisheng_llm: server_info: {server_info}, model_info: {model_info}')

        class_object = self._get_llm_class(LLMServerType(server_info.type))
        params = self._get_llm_params(server_info, model_info)
        try:
            self.llm = instantiate_llm(self.llm_node_type.get(server_info.type), class_object, params)
        except Exception as e:
            logger.exception('init bisheng llm error')
            raise Exception(f'初始化llm组件失败，请检查配置或联系管理员。错误信息：{e}')

    def _get_llm_class(self, server_type: LLMServerType) -> BaseLanguageModel:
        node_type = self.llm_node_type.get(server_type)
        class_object = import_by_type(_type='llms', name=node_type)
        return class_object

    def _get_llm_params(self, server_info: LLMServer, model_info: LLMModel) -> dict:
        params = {}
        if server_info.config:
            params.update(server_info.config)
        if model_info.config:
            params.update(model_info.config)

        params.update({
            'model_name': model_info.model_name,
            'streaming': self.streaming,
            'temperature': self.temperature,
            'top_p': self.top_p,
            'cache': self.cache
        })
        if server_info.type == LLMServerType.OLLAMA.value:
            params['model'] = params.pop('model_name')
        elif server_info.type == LLMServerType.XINFERENCE.value:
            params['model_uid'] = params.pop('model_name')
        elif server_info.type == LLMServerType.AZURE_OPENAI.value:
            params['azure_deployment'] = params.pop('model_name')
        elif server_info.type == LLMServerType.QIAN_FAN.value:
            params['model'] = params.pop('model_name')
        elif server_info.type == LLMServerType.SPARK.value:
            params['openai_api_key'] = f'{params.pop("api_key")}:{params.pop("api_secret")}'
        return params

    @property
    def _llm_type(self):
        return self.llm._llm_type

    def _generate(
            self,
            messages: List[BaseMessage],
            stop: Optional[List[str]] = None,
            run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
            stream: Optional[bool] = None,
            **kwargs: Any,
    ) -> ChatResult:
        try:
            ret = self.llm._generate(messages, stop, run_manager, **kwargs)
            self._update_model_status(0)
        except Exception as e:
            self._update_model_status(1, str(e))
            raise e
        return ret

    async def _agenerate(
            self,
            messages: List[BaseMessage],
            stop: Optional[List[str]] = None,
            run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
            stream: Optional[bool] = None,
            **kwargs: Any,
    ) -> ChatResult:
        try:
            ret = await self.llm._agenerate(messages, stop, run_manager, **kwargs)
            self._update_model_status(0)
        except Exception as e:
            self._update_model_status(1, str(e))
            # 记录失败状态
            raise e
        return ret

    def _update_model_status(self, status: int, remark: str = ''):
        """更新模型状态"""
        # todo 接入到异步任务模块
        LLMDao.update_model_status(self.model_id, status, remark)
