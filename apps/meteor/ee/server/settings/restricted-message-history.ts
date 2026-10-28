import { settingsRegistry } from '../../../server/settings';

export function addSettings(): Promise<void> {
	return settingsRegistry.addGroup('Message', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['restricted-message-history'],
			},
			async function () {
				await this.add('Restricted_Message_History_Enabled', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					section: 'Restricted_Message_History',
					i18nDescription: 'Restricted_Message_History_Enabled_Description',
				});
			},
		);
	});
}
