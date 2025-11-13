import { settingsRegistry } from '../../../../settings/server';

settingsRegistry.addGroup('OpenID_Connect', function () {
	this.add('OIDC_Enable', false, {
		type: 'boolean',
		public: true,
	});

	this.add('OIDC_Issuer', '', {
		type: 'string',
		public: true,
	});

	this.add('OIDC_Client_ID', '', {
		type: 'string',
		public: true,
	});

	this.add('OIDC_Client_Secret', '', {
		type: 'string',
		public: true,
		secret: true,
	});
});
