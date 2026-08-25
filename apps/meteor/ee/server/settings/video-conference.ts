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

				// 'main_room' keeps the historical behavior — a discussion created off the main room — for
				// workspaces that already had persistent chat enabled before the mode existed.
				await this.add('VideoConf_Persistent_Chat_Mode', 'main_room', {
					type: 'select',
					values: [
						{ key: 'main_room', i18nLabel: 'VideoConf_Persistent_Chat_Mode_Main_Room' },
						{ key: 'thread', i18nLabel: 'VideoConf_Persistent_Chat_Mode_Thread' },
					],
					public: true,
					invalidValue: 'main_room',
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
