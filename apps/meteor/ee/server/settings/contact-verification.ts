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

				await this.add('Livechat_Contact_Verification_App', '', {
					type: 'select',
					values: [{ key: 'VerifyChat', i18nLabel: 'VerifyChat' }],
					invalidValue: '',
				});

				await this.add('Livechat_Request_Verification_On_First_Contact_Only', false, {
					type: 'boolean',
					invalidValue: false,
				});
			},
		);
	});
};
