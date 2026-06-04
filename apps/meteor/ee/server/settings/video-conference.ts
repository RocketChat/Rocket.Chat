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

				await this.add('VideoConf_Persistent_Chat_Discussion_Name', 'Video Call Chat', {
					type: 'string',
					public: true,
					invalidValue: 'Conference Call Chat History',
					i18nDescription: 'VideoConf_Persistent_Chat_Discussion_Name_Description',
					enableQuery: [discussionsEnabled, persistentChatEnabled],
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

					await this.add('VideoConf_LiveKit_Recording_Enabled', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						enableQuery: [livekitEnabled],
					});

					const recordingEnabled = { _id: 'VideoConf_LiveKit_Recording_Enabled', value: true };

					await this.add('VideoConf_LiveKit_Recording_Storage', 's3', {
						type: 'select',
						values: [
							{ key: 'local', i18nLabel: 'Local_Disk' },
							{ key: 's3', i18nLabel: 'S3_compatible' },
							{ key: 'filestore', i18nLabel: 'Rocket_Chat_File_Store' },
							{ key: 'both', i18nLabel: 'Both' },
						],
						invalidValue: 's3',
						enableQuery: [livekitEnabled, recordingEnabled],
					});

					const localStorage = { _id: 'VideoConf_LiveKit_Recording_Storage', value: 'local' };

					await this.add('VideoConf_LiveKit_Recording_Local_Path', '/out', {
						type: 'string',
						invalidValue: '/out',
						i18nDescription: 'VideoConf_LiveKit_Recording_Local_Path_Description',
						enableQuery: [livekitEnabled, recordingEnabled, localStorage],
					});

					await this.add('VideoConf_LiveKit_Recording_S3_Access_Key', '', {
						type: 'string',
						secret: true,
						invalidValue: '',
						enableQuery: [livekitEnabled, recordingEnabled],
					});

					await this.add('VideoConf_LiveKit_Recording_S3_Secret_Key', '', {
						type: 'password',
						secret: true,
						invalidValue: '',
						enableQuery: [livekitEnabled, recordingEnabled],
					});

					await this.add('VideoConf_LiveKit_Agent_Mode', 'off', {
						type: 'select',
						values: [
							{ key: 'off', i18nLabel: 'Disabled' },
							{ key: 'embedded', i18nLabel: 'Embedded' },
						],
						invalidValue: 'off',
						i18nDescription: 'VideoConf_LiveKit_Agent_Mode_Description',
						enableQuery: [livekitEnabled],
					});

					const agentEmbedded = { _id: 'VideoConf_LiveKit_Agent_Mode', value: 'embedded' };

					await this.add('VideoConf_LiveKit_Agent_Gemini_Api_Key', '', {
						type: 'password',
						secret: true,
						invalidValue: '',
						i18nDescription: 'VideoConf_LiveKit_Agent_Gemini_Api_Key_Description',
						enableQuery: [livekitEnabled, agentEmbedded],
					});

					await this.add('VideoConf_LiveKit_Agent_Gemini_Model', '', {
						type: 'string',
						invalidValue: '',
						i18nDescription: 'VideoConf_LiveKit_Agent_Gemini_Model_Description',
						enableQuery: [livekitEnabled, agentEmbedded],
					});

					await this.add('VideoConf_LiveKit_Agent_Language_Hint', '', {
						type: 'string',
						invalidValue: '',
						i18nDescription: 'VideoConf_LiveKit_Agent_Language_Hint_Description',
						enableQuery: [livekitEnabled, agentEmbedded],
					});

					await this.add('VideoConf_LiveKit_Summary_Enabled', false, {
						type: 'boolean',
						invalidValue: false,
						i18nDescription: 'VideoConf_LiveKit_Summary_Enabled_Description',
						enableQuery: [livekitEnabled, agentEmbedded],
					});

					await this.add('VideoConf_LiveKit_Summary_Gemini_Model', 'gemini-2.5-flash', {
						type: 'string',
						invalidValue: 'gemini-2.5-flash',
						i18nDescription: 'VideoConf_LiveKit_Summary_Gemini_Model_Description',
						enableQuery: [livekitEnabled, agentEmbedded, { _id: 'VideoConf_LiveKit_Summary_Enabled', value: true }],
					});
				});
			},
		);
	});
}
