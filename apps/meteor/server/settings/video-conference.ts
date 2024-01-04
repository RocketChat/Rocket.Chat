import { settingsRegistry } from '../../app/settings/server';

export const createVConfSettings = () =>
	settingsRegistry.addGroup('Video_Conference', async function () {
		await this.add('VideoConf_Default_Provider', '', {
			type: 'lookup',
			lookupEndpoint: 'v1/video-conference.providers',
			public: true,
		});

		await this.add('VideoConf_Mobile_Ringing', false, {
			type: 'boolean',
			public: true,
			enterprise: true,
			modules: ['videoconference-enterprise'],
			invalidValue: false,
			alert: 'VideoConf_Mobile_Ringing_Alert',
		});

		// #ToDo: Those should probably be handled by the apps themselves
		await this.add('Jitsi_Click_To_Join_Count', 0, {
			type: 'int',
			hidden: true,
		});
		await this.add('Jitsi_Start_SlashCommands_Count', 0, {
			type: 'int',
			hidden: true,
		});
	});
