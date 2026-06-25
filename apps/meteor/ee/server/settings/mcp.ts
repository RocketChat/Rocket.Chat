import { settingsRegistry } from '../../../app/settings/server';

export const addSettings = (): Promise<void> =>
	settingsRegistry.addGroup('General', async function () {
		// Gated behind the `experimental-enterprise-features` license module: without it, the
		// settings fall back to their `invalidValue` (off), so the feature cannot be enabled.
		await this.with(
			{
				enterprise: true,
				modules: ['experimental-enterprise-features'],
			},
			async function () {
				await this.add('MCP_Enabled', false, {
					type: 'boolean',
					public: false,
					invalidValue: false,
					section: 'MCP',
					// Alpha feature: surfaces a warning banner on the setting in the admin UI.
					alert: 'MCP_Alpha_Alert',
					i18nLabel: 'MCP_Enabled',
					i18nDescription: 'MCP_Enabled_Description',
				});

				await this.add('MCP_Expose_Extended_API', false, {
					type: 'boolean',
					public: false,
					invalidValue: false,
					section: 'MCP',
					enableQuery: { _id: 'MCP_Enabled', value: true },
					i18nLabel: 'MCP_Expose_Extended_API',
					i18nDescription: 'MCP_Expose_Extended_API_Description',
				});
			},
		);
	});
