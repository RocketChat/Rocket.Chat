import { settingsRegistry } from '../../../app/settings/server';

export const addSettings = async (): Promise<void> => {
	const omnichannelEnabledQuery = { _id: 'Livechat_enabled', value: true };

	return settingsRegistry.addGroup('Omnichannel', async function () {
		return this.with(
			{
				enterprise: true,
				modules: ['livechat-enterprise', 'contact-id-verification'],
				section: 'Contact_identification',
				enableQuery: omnichannelEnabledQuery,
				public: true,
			},
			async function () {
				await this.add('Livechat_Block_Unknown_Contacts', false, {
					type: 'boolean',
					invalidValue: false,
				});

				await this.add('Livechat_Block_Unverified_Contacts', false, {
					type: 'boolean',
					invalidValue: false,
				});

				await this.add('Livechat_Require_Contact_Verification', 'never', {
					type: 'select',
					values: [
						{ key: 'never', i18nLabel: 'Never' },
						{ key: 'once', i18nLabel: 'Once' },
						{ key: 'always', i18nLabel: 'On_All_Contacts' },
					],
					invalidValue: 'never',
				});
			},
		);
	});
};
