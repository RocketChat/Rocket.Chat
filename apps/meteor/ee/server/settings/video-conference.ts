import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): Promise<void> {
	return settingsRegistry.addGroup('Video_Conference', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['videoconference-enterprise'],
			},
			async function () {
				await this.add('VideoConf_Enable_DMs', true, {
					type: 'boolean',
					public: true,
					invalidValue: true,
				});

				await this.add('VideoConf_Enable_Channels', true, {
					type: 'boolean',
					public: true,
					invalidValue: true,
				});

				await this.add('VideoConf_Enable_Groups', true, {
					type: 'boolean',
					public: true,
					invalidValue: true,
				});

				await this.add('VideoConf_Enable_Teams', true, {
					type: 'boolean',
					public: true,
					invalidValue: true,
				});

				const discussionsEnabled = { _id: 'Discussion_enabled', value: true };

				await this.add('VideoConf_Enable_Persistent_Chat', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					alert: 'VideoConf_Enable_Persistent_Chat_Alert',
					enableQuery: [discussionsEnabled],
				});

				const persistentChatEnabled = { _id: 'VideoConf_Enable_Persistent_Chat', value: true };

				await this.add('VideoConf_Persistent_Chat_Discussion_Name', 'Conference Call Chat History', {
					type: 'string',
					public: true,
					invalidValue: 'Conference Call Chat History',
					enableQuery: [discussionsEnabled, persistentChatEnabled],
				});
			},
		);
	});
}
