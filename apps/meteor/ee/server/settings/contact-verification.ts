import { settingsRegistry } from '../../../app/settings/server';

export const addSettings = async (): Promise<void> => {
	const omnichannelEnabledQuery = { _id: 'Livechat_enabled', value: true };

	return settingsRegistry.addGroup('Omnichannel', async function () {
		await this.add('Merged_Contacts_Count', 0, {
			type: 'int',
			hidden: true,
		});

		await this.add('Resolved_Conflicts_Count', 0, {
			type: 'int',
			hidden: true,
		});

		await this.add('Contacts_Importer_Count', 0, {
			type: 'int',
			hidden: true,
		});

		await this.add('Advanced_Contact_Upsell_Views_Count', 0, {
			type: 'int',
			hidden: true,
		});

		await this.add('Advanced_Contact_Upsell_Clicks_Count', 0, {
			type: 'int',
			hidden: true,
		});

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
