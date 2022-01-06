import { settingsRegistry } from '../../../settings/server';

settingsRegistry.addGroup('Omnichannel', function () {
	this.section('External Frame', function () {
		this.add('Omnichannel_External_Frame_Enabled', false, {
			type: 'boolean',
			public: true,
			alert: 'Experimental_Feature_Alert',
		});

		this.add('Omnichannel_External_Frame_URL', '', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'Omnichannel_External_Frame_Enabled',
				value: true,
			},
		});

		this.add('Omnichannel_External_Frame_Encryption_JWK', '', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'Omnichannel_External_Frame_Enabled',
				value: true,
			},
		});

		this.add('Omnichannel_External_Frame_GenerateKey', 'omnichannelExternalFrameGenerateKey', {
			type: 'action',
			actionText: 'Generate_new_key',
			enableQuery: {
				_id: 'Omnichannel_External_Frame_Enabled',
				value: true,
			},
		});
	});
});
