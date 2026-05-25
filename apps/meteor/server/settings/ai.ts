import { settingsRegistry } from '../../app/settings/server';

const AI_LICENSE_MODULE = 'chat.rocket.rc-ai' as const;

export const createAISettings = () =>
	settingsRegistry.addGroup('AI_Center', async function () {
		await this.section('AI_LLM_Providers', async function () {
			await this.add('AI_LLM_OpenAI_Base_URL', 'https://api.openai.com/v1', {
				type: 'string',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				i18nDescription: 'AI_LLM_OpenAI_Base_URL_Description',
			});

			await this.add('AI_LLM_OpenAI_API_Key', '', {
				type: 'password',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				i18nDescription: 'AI_LLM_OpenAI_API_Key_Description',
			});

			await this.add('AI_LLM_OpenAI_Model', '', {
				type: 'lookup',
				lookupEndpoint: 'v1/ai.llm.models',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				i18nDescription: 'AI_LLM_OpenAI_Model_Description',
			});
		});

		await this.section('Intelligent_Search', async function () {
			await this.add('AI_Intelligent_Search_Enabled', false, {
				type: 'boolean',
				public: true,
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: false,
				i18nDescription: 'AI_Intelligent_Search_Enabled_Description',
			});

			await this.add('AI_Intelligent_Search_Show_In_Top_Bar', true, {
				type: 'boolean',
				public: true,
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: false,
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
				i18nDescription: 'AI_Intelligent_Search_Show_In_Top_Bar_Description',
			});

			await this.add('AI_Intelligent_Search_Pipeline_Base_URL', '', {
				type: 'string',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
				i18nDescription: 'AI_Intelligent_Search_Pipeline_Base_URL_Description',
			});

			await this.add('AI_Intelligent_Search_Pipeline_ID', '', {
				type: 'string',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
				i18nDescription: 'AI_Intelligent_Search_Pipeline_ID_Description',
			});

			await this.add('AI_Intelligent_Search_API_Key', '', {
				type: 'password',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
			});

			await this.add('AI_Intelligent_Search_API_Key_Secret', '', {
				type: 'password',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
			});

			await this.add('AI_Intelligent_Search_Min_Similarity_Percent', 0, {
				type: 'int',
				public: true,
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: 0,
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
				i18nDescription: 'AI_Intelligent_Search_Min_Similarity_Percent_Description',
			});
			await this.add('AI_Intelligent_Search_Query_Template', '', {
				type: 'string',
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: '',
				enableQuery: { _id: 'AI_Intelligent_Search_Enabled', value: true },
				i18nDescription: 'AI_Intelligent_Search_Query_Template_Description',
			});
			await this.add('AI_Intelligent_Search_Answer_System_Prompt', '', {
				type: 'string',
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
				public: true,
				enterprise: true,
				modules: [AI_LICENSE_MODULE],
				invalidValue: false,
				i18nDescription: 'AI_Thread_Summarization_Enabled_Description',
			});
		});
	});
