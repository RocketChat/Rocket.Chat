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

				await this.add('VideoConf_Persistent_Chat_Discussion_Name', 'Video Call Chat', {
					type: 'string',
					public: true,
					invalidValue: 'Conference Call Chat History',
					i18nDescription: 'VideoConf_Persistent_Chat_Discussion_Name_Description',
					enableQuery: [discussionsEnabled, persistentChatEnabled],
				});

				// The switch for the whole call-window experience: the in-product conference page, the preflight
				// that is where a call is actually created, the ongoing-calls list that replaces the incoming-call
				// popup, and the membership-based flow around them. Off means the client behaves exactly as it did
				// before any of it existed.
				//
				// Deliberately *not* gated on `VideoConf_Enable_Persistent_Chat`, which keeps meaning only what it
				// has always meant — a discussion or thread per call. The conference window needs none of that: with
				// persistent chat off its chat panel simply shows the room the call was started in. Tying the two
				// together would also change what workspaces already running persistent chat see, which is the one
				// thing this must not do.
				await this.add('VideoConf_Conference_Window_Enabled', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					i18nDescription: 'VideoConf_Conference_Window_Enabled_Description',
				});
			},
		);
	});
}
