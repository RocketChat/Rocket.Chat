import { settingsRegistry } from '../../settings/server';

settingsRegistry.addGroup('Video Conference', function () {
	this.section('BigBlueButton', function () {
		this.add('bigbluebutton_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			alert: 'This Feature is currently in beta! Please report bugs to github.com/RocketChat/Rocket.Chat/issues',
			public: true,
		});

		this.add('bigbluebutton_server', '', {
			type: 'string',
			i18nLabel: 'Domain',
			enableQuery: {
				_id: 'bigbluebutton_Enabled',
				value: true,
			},
		});

		this.add('bigbluebutton_sharedSecret', '', {
			type: 'string',
			i18nLabel: 'Shared_Secret',
			enableQuery: {
				_id: 'bigbluebutton_Enabled',
				value: true,
			},
		});

		this.add('bigbluebutton_Open_New_Window', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'bigbluebutton_Enabled',
				value: true,
			},
			i18nLabel: 'Always_open_in_new_window',
			public: true,
		});

		this.add('bigbluebutton_enable_d', true, {
			type: 'boolean',
			i18nLabel: 'WebRTC_Enable_Direct',
			enableQuery: {
				_id: 'bigbluebutton_Enabled',
				value: true,
			},
			public: true,
		});

		this.add('bigbluebutton_enable_p', true, {
			type: 'boolean',
			i18nLabel: 'WebRTC_Enable_Private',
			enableQuery: {
				_id: 'bigbluebutton_Enabled',
				value: true,
			},
			public: true,
		});

		this.add('bigbluebutton_enable_c', false, {
			type: 'boolean',
			i18nLabel: 'WebRTC_Enable_Channel',
			enableQuery: {
				_id: 'bigbluebutton_Enabled',
				value: true,
			},
			public: true,
		});

		this.add('bigbluebutton_enable_teams', false, {
			type: 'boolean',
			i18nLabel: 'BBB_Enable_Teams',
			enableQuery: {
				_id: 'bigbluebutton_Enabled',
				value: true,
			},
			public: true,
		});
	});

	this.section('Jitsi', function () {
		this.add('Jitsi_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			alert: 'This Feature is currently in beta! Please report bugs to github.com/RocketChat/Rocket.Chat/issues',
			public: true,
		});

		this.add('Jitsi_Domain', 'meet.jit.si', {
			type: 'string',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true,
			},
			i18nLabel: 'Domain',
			public: true,
		});

		this.add('Jitsi_URL_Room_Prefix', 'RocketChat', {
			type: 'string',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true,
			},
			i18nLabel: 'URL_room_prefix',
			public: true,
		});

		this.add('Jitsi_URL_Room_Suffix', '', {
			type: 'string',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true,
			},
			i18nLabel: 'URL_room_suffix',
			public: true,
		});

		this.add('Jitsi_URL_Room_Hash', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true,
			},
			i18nLabel: 'URL_room_hash',
			i18nDescription: 'URL_room_hash_description',
			public: true,
		});

		this.add('Jitsi_SSL', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true,
			},
			i18nLabel: 'SSL',
			public: true,
		});

		this.add('Jitsi_Open_New_Window', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true,
			},
			i18nLabel: 'Always_open_in_new_window',
			public: true,
		});

		this.add('Jitsi_Enable_Channels', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true,
			},
			i18nLabel: 'Jitsi_Enable_Channels',
			public: true,
		});

		this.add('Jitsi_Enable_Teams', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true,
			},
			i18nLabel: 'Jitsi_Enable_Teams',
			public: true,
		});

		this.add('Jitsi_Chrome_Extension', 'nocfbnnmjnndkbipkabodnheejiegccf', {
			type: 'string',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true,
			},
			i18nLabel: 'Jitsi_Chrome_Extension',
			public: true,
		});

		this.add('Jitsi_Enabled_TokenAuth', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true,
			},
			i18nLabel: 'Jitsi_Enabled_TokenAuth',
			public: true,
		});

		this.add('Jitsi_Application_ID', '', {
			type: 'string',
			enableQuery: [
				{ _id: 'Jitsi_Enabled', value: true },
				{ _id: 'Jitsi_Enabled_TokenAuth', value: true },
			],
			i18nLabel: 'Jitsi_Application_ID',
		});

		this.add('Jitsi_Application_Secret', '', {
			type: 'string',
			enableQuery: [
				{ _id: 'Jitsi_Enabled', value: true },
				{ _id: 'Jitsi_Enabled_TokenAuth', value: true },
			],
			i18nLabel: 'Jitsi_Application_Secret',
		});

		this.add('Jitsi_Limit_Token_To_Room', true, {
			type: 'boolean',
			enableQuery: [
				{ _id: 'Jitsi_Enabled', value: true },
				{ _id: 'Jitsi_Enabled_TokenAuth', value: true },
			],
			i18nLabel: 'Jitsi_Limit_Token_To_Room',
			public: true,
		});
		this.add('Jitsi_Click_To_Join_Count', 0, {
			type: 'int',
			hidden: true,
		});
		this.add('Jitsi_Start_SlashCommands_Count', 0, {
			type: 'int',
			hidden: true,
		});
	});
});
