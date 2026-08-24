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
				});

				const persistentChatEnabled = { _id: 'VideoConf_Enable_Persistent_Chat', value: true };

				await this.add('VideoConf_Persistent_Chat_Mode', 'thread', {
					type: 'select',
					values: [
						{ key: 'thread', i18nLabel: 'Thread' },
						{ key: 'main_room', i18nLabel: 'Main_room' },
					],
					public: true,
					invalidValue: 'thread',
					i18nDescription: 'VideoConf_Persistent_Chat_Mode_Description',
					enableQuery: [persistentChatEnabled],
				});

				const discussionMode = { _id: 'VideoConf_Persistent_Chat_Mode', value: 'main_room' };

				await this.add('VideoConf_Persistent_Chat_Discussion_Name', 'Video Call Chat', {
					type: 'string',
					public: true,
					invalidValue: 'Conference Call Chat History',
					i18nDescription: 'VideoConf_Persistent_Chat_Discussion_Name_Description',
					enableQuery: [discussionsEnabled, persistentChatEnabled, discussionMode],
				});

				// LiveKit-as-VC-provider settings. The keys mirror the previous
				// VoIP_TeamCollab_LiveKit_* layout (same shape, same set) so the
				// admin UI is familiar — only the namespace moved from VoIP to
				// Video Conference. The corresponding VoIP_* keys are removed
				// once the refactor settles; until then both groups coexist and
				// the bootstrap reads the new keys, falling back to the old.
				await this.section('VideoConf_LiveKit', async function () {
					await this.add('VideoConf_LiveKit_Enabled', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						i18nDescription: 'VideoConf_LiveKit_Enabled_Description',
					});

					const livekitEnabled = { _id: 'VideoConf_LiveKit_Enabled', value: true };

					await this.add('VideoConf_LiveKit_Mode', 'self_hosted', {
						type: 'select',
						values: [
							{ key: 'self_hosted', i18nLabel: 'Self_hosted' },
							{ key: 'cloud', i18nLabel: 'LiveKit_Cloud' },
						],
						public: true,
						invalidValue: 'self_hosted',
						enableQuery: [livekitEnabled],
					});

					await this.add('VideoConf_LiveKit_Url', '', {
						type: 'string',
						public: true,
						invalidValue: '',
						enableQuery: [livekitEnabled],
					});

					await this.add('VideoConf_LiveKit_Api_Key', '', {
						type: 'string',
						secret: true,
						invalidValue: '',
						enableQuery: [livekitEnabled],
					});

					await this.add('VideoConf_LiveKit_Api_Secret', '', {
						type: 'password',
						secret: true,
						invalidValue: '',
						enableQuery: [livekitEnabled],
					});
				});
			},
		);
	});
}
