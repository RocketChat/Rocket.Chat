import { settingsRegistry } from '../../settings/server';

export const createOpenClawSettings = () =>
	settingsRegistry.addGroup('OpenClaw', async function () {
		await this.with(
			{
				section: 'General',
				i18nLabel: 'OpenClaw_General',
			},
			async function () {
				await this.add('OpenClaw_Enabled', false, {
					type: 'boolean',
					i18nLabel: 'OpenClaw_Enabled',
					i18nDescription: 'OpenClaw_Enabled_Description',
					public: true,
				});

				await this.add('OpenClaw_API_URL', '', {
					type: 'string',
					i18nLabel: 'OpenClaw_API_URL',
					i18nDescription: 'OpenClaw_API_URL_Description',
					enableQuery: { _id: 'OpenClaw_Enabled', value: true },
				});

				await this.add('OpenClaw_Auth_Token', '', {
					type: 'string',
					i18nLabel: 'OpenClaw_Auth_Token',
					i18nDescription: 'OpenClaw_Auth_Token_Description',
					enableQuery: { _id: 'OpenClaw_Enabled', value: true },
					secret: true,
				});
			},
		);

		await this.with(
			{
				section: 'Agent',
				i18nLabel: 'OpenClaw_Agent',
			},
			async function () {
				await this.add('OpenClaw_Default_Model', '', {
					type: 'string',
					i18nLabel: 'OpenClaw_Default_Model',
					i18nDescription: 'OpenClaw_Default_Model_Description',
					enableQuery: { _id: 'OpenClaw_Enabled', value: true },
				});

				await this.add('OpenClaw_Bot_Username', 'openclaw.bot', {
					type: 'string',
					i18nLabel: 'OpenClaw_Bot_Username',
					i18nDescription: 'OpenClaw_Bot_Username_Description',
					enableQuery: { _id: 'OpenClaw_Enabled', value: true },
				});

				await this.add('OpenClaw_Respond_In_Thread', true, {
					type: 'boolean',
					i18nLabel: 'OpenClaw_Respond_In_Thread',
					i18nDescription: 'OpenClaw_Respond_In_Thread_Description',
					enableQuery: { _id: 'OpenClaw_Enabled', value: true },
				});
			},
		);
	});

void createOpenClawSettings();
