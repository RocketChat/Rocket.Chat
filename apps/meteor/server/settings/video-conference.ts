import { settingsRegistry } from '../../app/settings/server';

settingsRegistry.addGroup('Video_Conference', function () {
	this.add('VideoConf_Enabled', true, {
		type: 'boolean',
		i18nLabel: 'Enabled',
		public: true,
	});

	this.add('VideoConf_Default_Provider', '', {
		type: 'lookup',
		lookupEndpoint: 'video-conference.providers',
		enableQuery: {
			_id: 'VideoConf_Enabled',
			value: true,
		},
		public: true,
	});

	this.add('VideoConf_Enable_DMs', false, {
		type: 'boolean',
		enableQuery: {
			_id: 'VideoConf_Enabled',
			value: true,
		},
		public: true,
	});

	this.add('VideoConf_Enable_Channels', false, {
		type: 'boolean',
		enableQuery: {
			_id: 'VideoConf_Enabled',
			value: true,
		},
		public: true,
	});

	this.add('VideoConf_Enable_Teams', false, {
		type: 'boolean',
		enableQuery: {
			_id: 'VideoConf_Enabled',
			value: true,
		},
		public: true,
	});
});
