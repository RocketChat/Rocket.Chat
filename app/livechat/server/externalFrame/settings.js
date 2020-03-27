import { settings } from '../../../settings/server/functions/settings';

settings.addGroup('Omnichannel', function() {
	this.section('External Frame', function() {
		this.add('Omnichannel_External_Frame_Enabled', false, {
			type: 'boolean',
			hidden: false,
			public: true,
			alert: 'Experimental_Feature_Alert',
		});

		this.add('Omnichannel_External_Frame_URL', '', {
			type: 'string',
			hidden: false,
			public: true,
			enableQuery: {
				_id: 'Omnichannel_External_Frame_Enabled',
				value: true,
			},
		});

		this.add('Omnichannel_External_Frame_SharedSecret', '', {
			type: 'string',
			hidden: false,
			public: true,
			enableQuery: {
				_id: 'Omnichannel_External_Frame_Enabled',
				value: true,
			},
		});
	});
});
