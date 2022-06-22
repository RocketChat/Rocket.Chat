import { settingsRegistry } from '../../app/settings/server';

settingsRegistry.addGroup('Video_Conference', function () {
	this.add('VideoConf_Default_Provider', '', {
		type: 'lookup',
		lookupEndpoint: 'v1/video-conference.providers',
		public: true,
	});

	// Keeping those untouched until we decide how to handle stats
	this.add('Jitsi_Click_To_Join_Count', 0, {
		type: 'int',
		hidden: true,
	});
	this.add('Jitsi_Start_SlashCommands_Count', 0, {
		type: 'int',
		hidden: true,
	});
});
