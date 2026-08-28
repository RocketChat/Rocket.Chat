import { settingsRegistry } from '../../../server/settings';

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

				// A thread off the call message is the mode we recommend, and nothing is being migrated away from
				// the other one: the setting is new, so no workspace had a persistent chat under it to preserve.
				await this.add('VideoConf_Persistent_Chat_Mode', 'thread', {
					type: 'select',
					values: [
						{ key: 'main_room', i18nLabel: 'VideoConf_Persistent_Chat_Mode_Main_Room' },
						{ key: 'thread', i18nLabel: 'VideoConf_Persistent_Chat_Mode_Thread' },
					],
					public: true,
					invalidValue: 'thread',
					i18nDescription: 'VideoConf_Persistent_Chat_Mode_Description',
					enableQuery: [persistentChatEnabled],
				});

				await this.add('VideoConf_Persistent_Chat_Discussion_Name', 'Video Call Chat', {
					type: 'string',
					public: true,
					invalidValue: 'Conference Call Chat History',
					i18nDescription: 'VideoConf_Persistent_Chat_Discussion_Name_Description',
					enableQuery: [discussionsEnabled, persistentChatEnabled],
				});
			},
		);
	});
}
