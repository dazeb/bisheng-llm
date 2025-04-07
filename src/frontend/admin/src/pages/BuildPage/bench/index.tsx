// src/features/chat-config/ChatConfig.tsx
import { Button } from "@/components/bs-ui/button";
import { Card, CardContent } from "@/components/bs-ui/card";
import { Label } from "@/components/bs-ui/label";
import { generateUUID } from "@/components/bs-ui/utils";
import { useState } from "react";
import { FormInput } from "./FormInput";
import { IconUploadSection } from "./IconUploadSection";
import { Model, ModelManagement } from "./ModelManagement";
import Preview from "./Preview";
import { ToggleSection } from "./ToggleSection";
import { WebSearchConfig } from "./WebSearchConfig";

export interface FormErrors {
    sidebarSlogan: string;
    welcomeMessage: string;
    functionDescription: string;
    inputPlaceholder: string;
    modelNames: string[];
}

export interface ChatConfigForm {
    sidebarIcon: {
        enabled: boolean;
        image: string;
    };
    assistantIcon: {
        enabled: boolean;
        image: string;
    };
    sidebarSlogan: string;
    welcomeMessage: string;
    functionDescription: string;
    inputPlaceholder: string;
    models: Model[];
    voiceInput: {
        enabled: boolean;
        model: string;
    };
    webSearch: {
        enabled: boolean;
        tool: string;
        bingKey: string;
        bingUrl: string;
        prompt: string;
    };
    knowledgeBase: {
        enabled: boolean;
        prompt: string;
    };
    fileUpload: {
        enabled: boolean;
        prompt: string;
    };
}

export default function index() {
    const {
        formData,
        errors,
        setFormData,
        handleInputChange,
        toggleFeature,
        handleSave
    } = useChatConfig();

    const uploadAvator = (fileUrl: string, type: 'sidebar' | 'assistant') => {
        setFormData(prev => ({
            ...prev,
            [`${type}Icon`]: { ...prev[`${type}Icon`], image: fileUrl }
        }));
    };

    const handleModelChange = (index: number, id: string) => {
        const newModels = [...formData.models];
        newModels[index].id = id;
        setFormData(prev => ({ ...prev, models: newModels }));
    };

    const handleModelNameChange = (index: number, name: string) => {
        const newModels = [...formData.models];
        newModels[index].displayName = name;
        setFormData(prev => ({ ...prev, models: newModels }));
    };

    const addModel = () => {
        setFormData(prev => ({
            ...prev,
            models: [...prev.models, { key: generateUUID(4), id: '', name: '', displayName: '' }]
        }));
    };

    return (
        <div className="px-10 py-10 h-full overflow-y-scroll scrollbar-hide relative bg-background-main border-t">
            <Card className="max-w-[985px]">
                <CardContent className="pt-4 relative  ">
                    <div className="w-full pr-96  max-h-[calc(100vh-180px)] overflow-y-scroll scrollbar-hide">
                        {/* Icon Uploads */}
                        <p className="text-lg font-bold mb-2">图标上传</p>
                        <div className="flex gap-8 mb-6">
                            <IconUploadSection
                                label="左侧边栏图标"
                                enabled={formData.sidebarIcon.enabled}
                                image={formData.sidebarIcon.image}
                                onToggle={(enabled) => toggleFeature('sidebarIcon', enabled)}
                                onUpload={(fileUrl) => uploadAvator(fileUrl, 'sidebar')}
                            />
                            <IconUploadSection
                                label="助手图标"
                                enabled={formData.assistantIcon.enabled}
                                image={formData.assistantIcon.image}
                                onToggle={(enabled) => toggleFeature('assistantIcon', enabled)}
                                onUpload={(fileUrl) => uploadAvator(fileUrl, 'assistant')}
                            />
                        </div>

                        {/* Form Inputs */}
                        <FormInput
                            label={<Label className="bisheng-label">左侧边栏slogan</Label>}
                            value={formData.sidebarSlogan}
                            error={errors.sidebarSlogan}
                            placeholder="Deepseek"
                            maxLength={15}
                            onChange={(v) => handleInputChange('sidebarSlogan', v, 15)}
                        />

                        <FormInput
                            label="欢迎语设置"
                            value={formData.welcomeMessage}
                            error={errors.welcomeMessage}
                            placeholder="我是 DeepSeek，很高兴见到你！"
                            maxLength={1000}
                            onChange={(v) => handleInputChange('welcomeMessage', v, 1000)}
                        />

                        <FormInput
                            label="功能说明"
                            value={formData.functionDescription}
                            error={errors.functionDescription}
                            placeholder="我可以帮你写代码、读文件、写作各种创意内容，请把你的任务交给我吧～"
                            maxLength={1000}
                            onChange={(v) => handleInputChange('functionDescription', v, 1000)}
                        />

                        <FormInput
                            label="输入框提示语"
                            value={formData.inputPlaceholder}
                            error={errors.inputPlaceholder}
                            placeholder="给Deepseek发送消息"
                            maxLength={1000}
                            onChange={(v) => handleInputChange('inputPlaceholder', v, 100)}
                        />

                        {/* Model Management */}
                        <div className="mb-6">
                            <p className="text-lg font-bold mb-2">对话模型管理</p>
                            <ModelManagement
                                models={formData.models}
                                errors={errors.modelNames}
                                onAdd={addModel}
                                onRemove={(index) => {
                                    const newModels = [...formData.models];
                                    newModels.splice(index, 1);
                                    setFormData(prev => ({ ...prev, models: newModels }));
                                }}
                                onModelChange={handleModelChange}
                                onNameChange={(index, name) => {
                                    handleModelNameChange(index, name);
                                }}
                            />
                        </div>

                        {/* Toggle Sections */}
                        {/* <ToggleSection
                            title="语音输入"
                            enabled={formData.voiceInput.enabled}
                            onToggle={(enabled) => toggleFeature('voiceInput', enabled)}
                        >
                            <Label className="bisheng-label">语音输入模型选择</Label>
                            <div className="mt-3">
                                <Select value={""} onValueChange={(val) => { }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="1">{t('model.yes')}</SelectItem>
                                            <SelectItem value="0">{t('model.no')}</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </ToggleSection> */}

                        <ToggleSection
                            title="联网搜索"
                            enabled={formData.webSearch.enabled}
                            onToggle={(enabled) => toggleFeature('webSearch', enabled)}
                        >
                            <WebSearchConfig
                                config={formData.webSearch}
                                onChange={(field, value) => setFormData(prev => ({
                                    ...prev,
                                    webSearch: { ...prev.webSearch, [field]: value }
                                }))}
                            />
                        </ToggleSection>

                        <ToggleSection
                            title="个人知识"
                            enabled={formData.knowledgeBase.enabled}
                            onToggle={(enabled) => toggleFeature('knowledgeBase', enabled)}
                        >
                            <FormInput
                                label={<Label className="bisheng-label">个人知识库搜索提示词</Label>}
                                isTextarea
                                value={formData.knowledgeBase.prompt}
                                error={''}
                                placeholder="deepseek官网上传文件提示词"
                                maxLength={9999}
                                onChange={(val) => setFormData(prev => ({
                                    ...prev,
                                    knowledgeBase: { ...prev.knowledgeBase, prompt: val }
                                }))}
                            />
                        </ToggleSection>

                        <ToggleSection
                            title="文件上传"
                            enabled={formData.fileUpload.enabled}
                            onToggle={(enabled) => toggleFeature('fileUpload', enabled)}
                        >
                            <FormInput
                                label={<Label className="bisheng-label">文件上传提示词</Label>}
                                isTextarea
                                value={formData.fileUpload.prompt}
                                error={''}
                                maxLength={9999}
                                onChange={(val) => setFormData(prev => ({
                                    ...prev,
                                    fileUpload: { ...prev.fileUpload, prompt: val }
                                }))}
                            />
                        </ToggleSection>

                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 absolute bottom-4 right-4">
                        <Preview />
                        <Button onClick={handleSave}>保存</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}




const useChatConfig = () => {
    const [formData, setFormData] = useState<ChatConfigForm>({
        sidebarIcon: { enabled: true, image: '' },
        assistantIcon: { enabled: true, image: '' },
        sidebarSlogan: '',
        welcomeMessage: '',
        functionDescription: '',
        inputPlaceholder: '',
        models: [{ key: generateUUID(4), id: null, name: '', displayName: '' }],
        voiceInput: { enabled: false, model: '' },
        webSearch: {
            enabled: true,
            tool: 'bing',
            bingKey: '',
            bingUrl: 'https://api.bing.microsoft.com/v7.0/search',
            prompt: `# 以下内容是基于用户发送的消息的搜索结果:
{search_results}
在我给你的搜索结果中，每个结果都是[webpage X begin]...[webpage X end]格式的，X代表每篇文章的数字索引。请在适当的情况下在句子末尾引用上下文。请按照引用编号[citation:X]的格式在答案中对应部分引用上下文。如果一句话源自多个上下文，请列出所有相关的引用编号，例如[citation:3][citation:5]，切记不要将引用集中在最后返回引用编号，而是在答案对应部分列出。
在回答时，请注意以下几点：
- 今天是{cur_date}。
- 并非搜索结果的所有内容都与用户的问题密切相关，你需要结合问题，对搜索结果进行甄别、筛选。
- 对于列举类的问题（如列举所有航班信息），尽量将答案控制在10个要点以内，并告诉用户可以查看搜索来源、获得完整信息。优先提供信息完整、最相关的列举项；如非必要，不要主动告诉用户搜索结果未提供的内容。
- 对于创作类的问题（如写论文），请务必在正文的段落中引用对应的参考编号，例如[citation:3][citation:5]，不能只在文章末尾引用。你需要解读并概括用户的题目要求，选择合适的格式，充分利用搜索结果并抽取重要信息，生成符合用户要求、极具思想深度、富有创造力与专业性的答案。你的创作篇幅需要尽可能延长，对于每一个要点的论述要推测用户的意图，给出尽可能多角度的回答要点，且务必信息量大、论述详尽。
- 如果回答很长，请尽量结构化、分段落总结。如果需要分点作答，尽量控制在5个点以内，并合并相关的内容。
- 对于客观类的问答，如果问题的答案非常简短，可以适当补充一到两句相关信息，以丰富内容。
- 你需要根据用户要求和回答内容选择合适、美观的回答格式，确保可读性强。
- 你的回答应该综合多个相关网页来回答，不能重复引用一个网页。
- 除非用户要求，否则你回答的语言需要和用户提问的语言保持一致。

# 用户消息为：
{question}`,
        },
        knowledgeBase: { enabled: true, prompt: '' },
        fileUpload: {
            enabled: true,
            prompt: '[file name]: {file_name}\n...',
        },
    });

    const [errors, setErrors] = useState<FormErrors>({
        sidebarSlogan: '',
        welcomeMessage: '',
        functionDescription: '',
        inputPlaceholder: '',
        modelNames: [],
    });

    const handleInputChange = (field: keyof ChatConfigForm, value: string, maxLength: number) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // if (value.length > maxLength) {
        //     setErrors(prev => ({ ...prev, [field]: `最多${maxLength}个字符` }));
        // } else {
        //     setErrors(prev => ({ ...prev, [field]: '' }));
        // }
    };

    const toggleFeature = (feature: keyof ChatConfigForm, enabled: boolean) => {
        setFormData(prev => ({
            ...prev,
            [feature]: { ...prev[feature], enabled }
        }));
    };

    const validateForm = (): boolean => {
        let isValid = true;
        const newErrors: FormErrors = {
            sidebarSlogan: '',
            welcomeMessage: '',
            functionDescription: '',
            inputPlaceholder: '',
            modelNames: [],
        };

        if (formData.sidebarSlogan.length > 15) {
            newErrors.sidebarSlogan = '最多15个字符';
            isValid = false;
        }

        // Validate welcome message
        if (formData.welcomeMessage.length > 1000) {
            newErrors.welcomeMessage = '最多1000个字符';
            isValid = false;
        }

        // Validate function description
        if (formData.functionDescription.length > 1000) {
            newErrors.functionDescription = '最多1000个字符';
            isValid = false;
        }

        // Validate input placeholder
        if (formData.inputPlaceholder.length > 100) {
            newErrors.inputPlaceholder = '最多100个字符';
            isValid = false;
        }

        // Validate models
        const modelNameErrors: string[] = [];
        formData.models.forEach((model, index) => {
            if (!model.displayName.trim()) {
                modelNameErrors[index] = '模型名称不能为空';
                isValid = false;
            } else if (model.displayName.length > 30) {
                modelNameErrors[index] = '最多30个字符';
                isValid = false;
            }
        });
        newErrors.modelNames = modelNameErrors;

        setErrors(newErrors);
        return isValid;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            // Prepare the data to be saved
            const dataToSave = {
                ...formData,
                // Ensure sidebar slogan has a default value
                sidebarSlogan: formData.sidebarSlogan.trim() || 'Deepseek',
                welcomeMessage: formData.welcomeMessage.trim() || '我是 DeepSeek，很高兴见到你！',
                functionDescription: formData.functionDescription.trim() || '我可以帮你写代码、读文件、写作各种创意内容，请把你的任务交给我吧～',
                inputPlaceholder: formData.inputPlaceholder.trim() || '使用默认“给Deepseek发送消息',
            };

            // Here you would typically make an API call to save the data
            // For example:
            // const response = await api.saveChatConfig(dataToSave);
            console.log('Saving data:', dataToSave);

            // Show success message or handle response
            // toast.success('配置保存成功');
        } catch (error) {
            console.error('保存失败:', error);
            // toast.error('保存失败');
        }
    };

    return {
        formData,
        errors,
        setFormData,
        setErrors,
        handleInputChange,
        toggleFeature,
        handleSave
    };
};