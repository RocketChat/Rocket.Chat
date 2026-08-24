import { generateEd25519RandomSecretKey } from '@rocket.chat/federation-matrix';

import { settingsRegistry } from '.';

export const createFederationServiceSettings = async (): Promise<void> => {
	await settingsRegistry.addGroup('Federation', async function () {
		await this.add('Federation_Service_Enabled', false, {
			type: 'boolean',
			public: true,
			enterprise: true,
			modules: ['federation'],
			invalidValue: false,
		});

		await this.add('Federation_Service_Domain', '', {
			type: 'string',
			public: false,
			enterprise: true,
			modules: ['federation'],
			invalidValue: '',
			alert: 'Federation_Service_Domain_Alert',
		});

		await this.add('Federation_Service_Matrix_Signing_Algorithm', 'ed25519', {
			type: 'select',
			public: false,
			values: [{ key: 'ed25519', i18nLabel: 'ed25519' }],
			enterprise: true,
			modules: ['federation'],
			invalidValue: 'ed25519',
		});

		await this.add('Federation_Service_Matrix_Signing_Version', '0', {
			type: 'string',
			public: false,
			readonly: true,
			enterprise: true,
			modules: ['federation'],
			invalidValue: '0',
		});

		const randomKey = generateEd25519RandomSecretKey().toString('base64');

		// https://spec.matrix.org/v1.16/appendices/#signing-details
		await this.add('Federation_Service_Matrix_Signing_Key', randomKey, {
			type: 'password',
			public: false,
			enterprise: true,
			modules: ['federation'],
			invalidValue: '',
		});

		await this.add('Federation_Service_max_allowed_size_of_public_rooms_to_join', 100, {
			type: 'int',
			public: false,
			alert: 'Federation_Service_max_allowed_size_of_public_rooms_to_join_Alert',
			enterprise: true,
			modules: ['federation'],
			invalidValue: false,
		});

		await this.add('Federation_Service_Allow_List', '', {
			type: 'string',
			i18nLabel: 'Federation_Service_Allow_List',
			i18nDescription: 'Federation_Service_Allow_List_Description',
			public: false,
		});

		await this.add('Federation_Service_EDU_Process_Typing', true, {
			type: 'boolean',
			public: false,
			enterprise: true,
			modules: ['federation'],
			invalidValue: false,
			alert: 'Federation_Service_EDU_Process_Typing_Alert',
		});

		await this.add('Federation_Service_EDU_Process_Presence', false, {
			type: 'boolean',
			public: false,
			enterprise: true,
			modules: ['federation'],
			invalidValue: false,
			alert: 'Federation_Service_EDU_Process_Presence_Alert',
		});

		await this.add('Federation_Service_EDU_Process_Receipt', false, {
			type: 'boolean',
			public: true,
			enterprise: true,
			modules: ['federation'],
			invalidValue: false,
			alert: 'Federation_Service_EDU_Process_Receipt_Alert',
		});

		await this.add('Federation_Service_Join_Encrypted_Rooms', false, {
			type: 'boolean',
			public: false,
			enterprise: true,
			modules: ['federation'],
			invalidValue: false,
		});

		await this.add('Federation_Service_Join_Non_Private_Rooms', false, {
			type: 'boolean',
			public: false,
			enterprise: true,
			modules: ['federation'],
			invalidValue: false,
		});

		await this.add('Federation_Service_Validate_User_Domain', false, {
			type: 'boolean',
			public: false,
			enterprise: true,
			modules: ['federation'],
			invalidValue: false,
		});

		await this.section('XMPP', async function () {
			await this.add('Federation_XMPP_Enabled', false, {
				type: 'boolean',
				enterprise: true,
				modules: ['federation'],
				i18nLabel: 'Enabled',
				invalidValue: false,
				enableQuery: { _id: 'Federation_Service_Enabled', value: true },
			});

			await this.add('Federation_XMPP_Bridge_URL', '', {
				type: 'string',
				enterprise: true,
				modules: ['federation'],
				invalidValue: '',
				enableQuery: { _id: 'Federation_XMPP_Enabled', value: true },
			});

			await this.add('Federation_XMPP_Bridge_HS_Token', '', {
				type: 'password',
				enterprise: true,
				modules: ['federation'],
				invalidValue: '',
				enableQuery: { _id: 'Federation_XMPP_Enabled', value: true },
			});

			await this.add('Federation_XMPP_Bridge_AS_Token', '', {
				type: 'password',
				enterprise: true,
				modules: ['federation'],
				invalidValue: '',
				enableQuery: { _id: 'Federation_XMPP_Enabled', value: true },
			});
		});
	});
};
