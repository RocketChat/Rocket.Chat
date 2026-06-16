import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';

import { settingsRegistry } from '../../app/settings/server';

const AI_SETTINGS_GROUP = 'AI_Center';

const addAISetting = (
	section: string,
	_id: string,
	value: Parameters<typeof settingsRegistry.add>[1],
	options: NonNullable<Parameters<typeof settingsRegistry.add>[2]>,
): Promise<void> => settingsRegistry.add(_id, value, { group: AI_SETTINGS_GROUP, section, ...options });

export const createAISettings = async () => {
	await addAISetting('AI_LLM_Provider', 'AI_LLM_OpenAI_Base_URL', 'https://api.openai.com/v1', {
		type: 'string',
		i18nLabel: 'AI_LLM_OpenAI_Base_URL',
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: '',
		i18nDescription: 'AI_LLM_OpenAI_Base_URL_Description',
	});

	await addAISetting('AI_LLM_Provider', 'AI_LLM_OpenAI_API_Key', '', {
		type: 'password',
		i18nLabel: 'AI_LLM_OpenAI_API_Key',
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: '',
		i18nDescription: 'AI_LLM_OpenAI_API_Key_Description',
	});

	await addAISetting('AI_LLM_Provider', 'AI_LLM_OpenAI_Model', '', {
		type: 'lookup',
		lookupEndpoint: 'v1/ai.llm.models',
		i18nLabel: 'AI_LLM_OpenAI_Model',
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: '',
		i18nDescription: 'AI_LLM_OpenAI_Model_Description',
	});

	await addAISetting('Intelligent_Search', 'AI_Intelligent_Search_Enabled', false, {
		type: 'boolean',
		i18nLabel: 'AI_Intelligent_Search_Enabled',
		public: true,
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: false,
		i18nDescription: 'AI_Intelligent_Search_Enabled_Description',
	});

	await addAISetting('Intelligent_Search', 'AI_Intelligent_Search_Pipeline_Base_URL', '', {
		type: 'string',
		i18nLabel: 'AI_Intelligent_Search_Pipeline_Base_URL',
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: '',
		enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
		i18nDescription: 'AI_Intelligent_Search_Pipeline_Base_URL_Description',
	});

	await addAISetting('Intelligent_Search', 'AI_Intelligent_Search_Pipeline_ID', '', {
		type: 'string',
		i18nLabel: 'AI_Intelligent_Search_Pipeline_ID',
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: '',
		enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
		i18nDescription: 'AI_Intelligent_Search_Pipeline_ID_Description',
	});

	await addAISetting('Intelligent_Search', 'AI_Intelligent_Search_API_Key', '', {
		type: 'password',
		i18nLabel: 'AI_Intelligent_Search_API_Key',
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: '',
		enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
	});

	await addAISetting('Intelligent_Search', 'AI_Intelligent_Search_API_Key_Secret', '', {
		type: 'password',
		i18nLabel: 'AI_Intelligent_Search_API_Key_Secret',
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: '',
		enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
	});

	await addAISetting('Intelligent_Search', 'AI_Intelligent_Search_Min_Similarity_Percent', 0, {
		type: 'int',
		i18nLabel: 'AI_Intelligent_Search_Min_Similarity_Percent',
		public: true,
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: 0,
		enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
		i18nDescription: 'AI_Intelligent_Search_Min_Similarity_Percent_Description',
	});

	await addAISetting('Intelligent_Search', 'AI_Intelligent_Search_Query_Template', '', {
		type: 'string',
		i18nLabel: 'AI_Intelligent_Search_Query_Template',
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: '',
		enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
		i18nDescription: 'AI_Intelligent_Search_Query_Template_Description',
	});

	await addAISetting('Intelligent_Search', 'AI_Intelligent_Search_Answer_Enabled', true, {
		type: 'boolean',
		i18nLabel: 'AI_Intelligent_Search_Answer_Enabled',
		public: true,
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: false,
		enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
		i18nDescription: 'AI_Intelligent_Search_Answer_Enabled_Description',
	});

	await addAISetting('Intelligent_Search', 'AI_Intelligent_Search_Answer_System_Prompt', '', {
		type: 'string',
		i18nLabel: 'AI_Intelligent_Search_Answer_System_Prompt',
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: '',
		enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
		i18nDescription: 'AI_Intelligent_Search_Answer_System_Prompt_Description',
	});

	await addAISetting('AI_Thread_Summarization', 'AI_Thread_Summarization_Enabled', false, {
		type: 'boolean',
		i18nLabel: 'AI_Thread_Summarization_Enabled',
		public: true,
		enterprise: true,
		modules: [AI_LICENSE_MODULE],
		invalidValue: false,
		i18nDescription: 'AI_Thread_Summarization_Enabled_Description',
	});
};
