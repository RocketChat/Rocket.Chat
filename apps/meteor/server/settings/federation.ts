import { FederationKeys } from '@rocket.chat/models';

import { settingsRegistry } from '../../app/settings/server';

export const createFederationSettings = () =>
	settingsRegistry.addGroup('Federation', async function () {
		await this.section('Rocket.Chat Federation', async function () {
			await this.add('FEDERATION_Enabled', false, {
				type: 'boolean',
				i18nLabel: 'Enabled',
				i18nDescription: 'FEDERATION_Enabled',
				alert: 'This_is_a_deprecated_feature_alert',
				public: true,
			});

			await this.add('FEDERATION_Status', 'Disabled', {
				readonly: true,
				type: 'string',
				i18nLabel: 'FEDERATION_Status',
			});

			await this.add('FEDERATION_Domain', '', {
				type: 'string',
				i18nLabel: 'FEDERATION_Domain',
				i18nDescription: 'FEDERATION_Domain_Description',
				alert: 'FEDERATION_Domain_Alert',
				// disableReset: true,
			});

			const federationPublicKey = await FederationKeys.getPublicKeyString();

			await this.add('FEDERATION_Public_Key', federationPublicKey || '', {
				readonly: true,
				type: 'string',
				multiline: true,
				i18nLabel: 'FEDERATION_Public_Key',
				i18nDescription: 'FEDERATION_Public_Key_Description',
			});

			await this.add('FEDERATION_Discovery_Method', 'dns', {
				type: 'select',
				values: [
					{
						key: 'dns',
						i18nLabel: 'DNS',
					},
					{
						key: 'hub',
						i18nLabel: 'Hub',
					},
				],
				i18nLabel: 'FEDERATION_Discovery_Method',
				i18nDescription: 'FEDERATION_Discovery_Method_Description',
				public: true,
			});

			await this.add('FEDERATION_Test_Setup', 'FEDERATION_Test_Setup', {
				type: 'action',
				actionText: 'FEDERATION_Test_Setup',
			});
		});
	});
