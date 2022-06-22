import { settingsRegistry } from '../../app/settings/server';

settingsRegistry.addGroup('Video_Conference', function () {
	this.add('VideoConf_Default_Provider', '', {
		type: 'lookup',
		lookupEndpoint: 'v1/video-conference.providers',
		public: true,
	});

	// #ToDo: Those should probably be handled by the apps themselves
	this.add('Jitsi_Click_To_Join_Count', 0, {
		type: 'int',
		hidden: true,
	});
	this.add('Jitsi_Start_SlashCommands_Count', 0, {
		type: 'int',
		hidden: true,
	});
});
