import { settingsRegistry } from '../../../settings/server';

void settingsRegistry.addGroup('Accounts', async function () {
	await this.section('Two Factor Authentication', async function () {
		const enable2FA = {
			_id: 'Accounts_TwoFactorAuthentication_Enabled',
			value: true,
		};

		await this.add('Accounts_TwoFactorAuthentication_Enabled', true, {
			type: 'boolean',
			public: true,
		});
		await this.add('Accounts_TwoFactorAuthentication_MaxDelta', 1, {
			type: 'int',
			enableQuery: enable2FA,
		});

		await this.add('Accounts_TwoFactorAuthentication_By_TOTP_Enabled', true, {
			type: 'boolean',
			enableQuery: enable2FA,
			public: true,
		});

		await this.add('Accounts_TwoFactorAuthentication_By_Email_Enabled', true, {
			type: 'boolean',
			enableQuery: enable2FA,
			public: true,
		});

		await this.add('Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In', true, {
			type: 'boolean',
			enableQuery: [
				enable2FA,
				{
					_id: 'Accounts_TwoFactorAuthentication_By_Email_Enabled',
					value: true,
				},
			],
			wizard: {
				step: 3,
				order: 3,
			},
		});

		await this.add('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration', 3600, {
			type: 'int',
			enableQuery: [
				enable2FA,
				{
					_id: 'Accounts_TwoFactorAuthentication_By_Email_Enabled',
					value: true,
				},
			],
		});

		await this.add('Accounts_TwoFactorAuthentication_RememberFor', 1800, {
			type: 'int',
			enableQuery: enable2FA,
		});

		// TODO: Remove this setting for version 4.0
		await this.add('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback', true, {
			type: 'boolean',
			enableQuery: enable2FA,
			public: true,
		});
	});
});
