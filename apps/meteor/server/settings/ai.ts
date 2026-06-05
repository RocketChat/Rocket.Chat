import { settingsRegistry } from '../../app/settings/server';

const AI_LICENSE_MODULE = 'chat.rocket.rc-ai' as const;

export const createAISettings = () =>
	settingsRegistry.addGroup('AI_Center', async function () {
		await this.section('AI_LLM_Provider', async function () {
			await this.add('AI_LLM_OpenAI_Base_URL', 'https://api.openai.com/v1', {
				type: 'string',
				i18nLabel: 'AI_LLM_OpenAI_Base_URL',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				i18nDescription: 'AI_LLM_OpenAI_Base_URL_Description',
			});

			await this.add('AI_LLM_OpenAI_API_Key', '', {
				type: 'password',
				i18nLabel: 'AI_LLM_OpenAI_API_Key',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				i18nDescription: 'AI_LLM_OpenAI_API_Key_Description',
			});

			await this.add('AI_LLM_OpenAI_Model', '', {
				type: 'lookup',
				lookupEndpoint: 'v1/ai.llm.models',
				i18nLabel: 'AI_LLM_OpenAI_Model',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				i18nDescription: 'AI_LLM_OpenAI_Model_Description',
			});
		});

		await this.section('Intelligent_Search', async function () {
			await this.add('AI_Intelligent_Search_Enabled', false, {
				type: 'boolean',
				i18nLabel: 'AI_Intelligent_Search_Enabled',
				public: true,
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: false,
				i18nDescription: 'AI_Intelligent_Search_Enabled_Description',
			});

			await this.add('AI_Intelligent_Search_Show_In_Top_Bar', true, {
				type: 'boolean',
				i18nLabel: 'AI_Intelligent_Search_Show_In_Top_Bar',
				public: true,
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: false,
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
				i18nDescription: 'AI_Intelligent_Search_Show_In_Top_Bar_Description',
			});

			await this.add('AI_Intelligent_Search_Pipeline_Base_URL', '', {
				type: 'string',
				i18nLabel: 'AI_Intelligent_Search_Pipeline_Base_URL',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
				i18nDescription: 'AI_Intelligent_Search_Pipeline_Base_URL_Description',
			});

			await this.add('AI_Intelligent_Search_Pipeline_ID', '', {
				type: 'string',
				i18nLabel: 'AI_Intelligent_Search_Pipeline_ID',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
				i18nDescription: 'AI_Intelligent_Search_Pipeline_ID_Description',
			});

			await this.add('AI_Intelligent_Search_API_Key', '', {
				type: 'password',
				i18nLabel: 'AI_Intelligent_Search_API_Key',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
			});

			await this.add('AI_Intelligent_Search_API_Key_Secret', '', {
				type: 'password',
				i18nLabel: 'AI_Intelligent_Search_API_Key_Secret',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
			});

			await this.add('AI_Intelligent_Search_Min_Similarity_Percent', 0, {
				type: 'int',
				i18nLabel: 'AI_Intelligent_Search_Min_Similarity_Percent',
				public: true,
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: 0,
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
				i18nDescription: 'AI_Intelligent_Search_Min_Similarity_Percent_Description',
			});
			await this.add('AI_Intelligent_Search_Query_Template', '', {
				type: 'string',
				i18nLabel: 'AI_Intelligent_Search_Query_Template',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
				i18nDescription: 'AI_Intelligent_Search_Query_Template_Description',
			});
			await this.add('AI_Intelligent_Search_Answer_System_Prompt', '', {
				type: 'string',
				i18nLabel: 'AI_Intelligent_Search_Answer_System_Prompt',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
				i18nDescription: 'AI_Intelligent_Search_Answer_System_Prompt_Description',
			});
		});

		await this.section('AI_Thread_Summarization', async function () {
			await this.add('AI_Thread_Summarization_Enabled', false, {
				type: 'boolean',
				i18nLabel: 'AI_Thread_Summarization_Enabled',
				public: true,
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: false,
				i18nDescription: 'AI_Thread_Summarization_Enabled_Description',
			});
		});
	});
