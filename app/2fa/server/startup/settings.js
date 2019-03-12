import { settings } from '/app/settings';

settings.addGroup('Accounts', function() {
	this.section('Two Factor Authentication', function() {
		this.add('Accounts_TwoFactorAuthentication_Enabled', true, {
			type: 'boolean',
			public: true,
		});
		this.add('Accounts_TwoFactorAuthentication_MaxDelta', 1, {
			type: 'int',
			public: true,
			i18nLabel: 'Accounts_TwoFactorAuthentication_MaxDelta',
			enableQuery: {
				_id: 'Accounts_TwoFactorAuthentication_Enabled',
				value: true,
			},
		});
	});
});


