import { settingsRegistry } from '../../settings/server';

settingsRegistry.addGroup('General', function () {
	this.section('REST API', function () {
		this.add('API_Upper_Count_Limit', 100, { type: 'int', public: false });
		this.add('API_Default_Count', 50, { type: 'int', public: false });
		this.add('API_Allow_Infinite_Count', true, { type: 'boolean', public: false });
		this.add('API_Enable_Direct_Message_History_EndPoint', false, {
			type: 'boolean',
			public: false,
		});
		this.add('API_Enable_Shields', true, { type: 'boolean', public: false });
		this.add('API_Shield_Types', '*', {
			type: 'string',
			public: false,
			enableQuery: { _id: 'API_Enable_Shields', value: true },
		});
		this.add('API_Shield_user_require_auth', false, {
			type: 'boolean',
			public: false,
			enableQuery: { _id: 'API_Enable_Shields', value: true },
		});
		this.add('API_Enable_CORS', false, { type: 'boolean', public: false });
		this.add('API_CORS_Origin', '*', {
			type: 'string',
			public: false,
			enableQuery: { _id: 'API_Enable_CORS', value: true },
		});

		this.add('API_Use_REST_For_DDP_Calls', true, {
			type: 'boolean',
			public: true,
		});
	});
});
