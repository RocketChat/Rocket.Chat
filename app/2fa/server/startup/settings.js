import { settings } from '../../../settings';

settings.addGroup('Accounts', function() {
	this.section('Two Factor Authentication', function() {
		this.add('Accounts_TwoFactorAuthentication_Enabled', true, {
			type: 'boolean',
			public: true,
		});
		this.add('Accounts_TwoFactorAuthentication_MaxDelta', 1, {
			type: 'int',
			enableQuery: {
				_id: 'Accounts_TwoFactorAuthentication_Enabled',
				value: true,
			},
		});

		this.add('Accounts_TwoFactorAuthentication_By_Email_Enabled', true, {
			type: 'boolean',
			public: true,
		});
		this.add('Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'Accounts_TwoFactorAuthentication_By_Email_Enabled',
				value: true,
			},
			wizard: {
				step: 3,
				order: 3,
			},
		});
		this.add('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration', 3600, {
			type: 'int',
			enableQuery: {
				_id: 'Accounts_TwoFactorAuthentication_By_Email_Enabled',
				value: true,
			},
		});

		this.add('Accounts_TwoFactorAuthentication_RememberFor', 1800, {
			type: 'int',
		});

		// TODO: Remove this setting for version 4.0
		this.add('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback', true, {
			type: 'boolean',
			public: true,
		});
	});
});
