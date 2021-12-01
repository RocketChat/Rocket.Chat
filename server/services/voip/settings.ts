import { settingsRegistry } from '../../../app/settings/server';


settingsRegistry.addGroup('VoIP', function() {
	this.add('VoIP_Enabled', false, {
		type: 'boolean',
		public: true,
		alert: 'Experimental_Feature_Alert',
	});

	this.section('Server Configuration', function() {
		// TODO: Remove default values before deploying
		this.add('VoIP_Server_Host', 'omni-asterisk.dev.rocket.chat', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'VoIP_Enabled',
				value: true,
			},
		});
		this.add('VoIP_Server_Websocket_Port', '443', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'VoIP_Enabled',
				value: true,
			},
		});
		this.add('VoIP_Server_Name', 'OmniAsterisk', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'VoIP_Enabled',
				value: true,
			},
		});
		this.add('VoIP_Server_Websocket_Path', 'wss://omni-asterisk.dev.rocket.chat/ws', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'VoIP_Enabled',
				value: true,
			},
		});
	});

	this.section('Management Server', function() {
		this.add('VoIP_Management_Server_Host', 'omni-asterisk.dev.rocket.chat', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'VoIP_Enabled',
				value: true,
			},
		});

		this.add('VoIP_Management_Server_Port', '5038', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'VoIP_Enabled',
				value: true,
			},
		});

		this.add('VoIP_Management_Server_Name', 'OmniAsterisk', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'VoIP_Enabled',
				value: true,
			},
		});

		this.add('VoIP_Management_Server_Username', 'amol', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'VoIP_Enabled',
				value: true,
			},
		});

		this.add('VoIP_Management_Server_Password', '1234', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'VoIP_Enabled',
				value: true,
			},
		});
	});
});
