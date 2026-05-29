import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): Promise<void> {
	return settingsRegistry.addGroup('VoIP_TeamCollab', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['teams-voip'],
			},
			async function () {
				await this.section('VoIP_TeamCollab_WebRTC', async function () {
					await this.add('VoIP_TeamCollab_Screen_Sharing_Enabled', true, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						alert: 'VoIP_TeamCollab_Screen_Sharing_Enabled_Alert',
						i18nDescription: 'VoIP_TeamCollab_Screen_Sharing_Enabled_Description',
					});

					await this.add('VoIP_TeamCollab_Video_Enabled', true, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						i18nDescription: 'VoIP_TeamCollab_Video_Enabled_Description',
					});

					await this.add('VoIP_TeamCollab_Mobile_Ringing_Enabled', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						alert: 'VoIP_TeamCollab_Mobile_Ringing_Enabled_Alert',
						i18nDescription: 'VoIP_TeamCollab_Mobile_Ringing_Enabled_Description',
					});

					await this.add('VoIP_TeamCollab_Ice_Servers', 'stun:stun.l.google.com:19302', {
						type: 'string',
						public: true,
						invalidValue: '',
					});

					await this.add('VoIP_TeamCollab_Ice_Gathering_Timeout', 5000, {
						type: 'int',
						public: true,
						invalidValue: 5000,
					});
				});

				await this.section('VoIP_TeamCollab_LiveKit', async function () {
					await this.add('VoIP_TeamCollab_LiveKit_Enabled', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						i18nDescription: 'VoIP_TeamCollab_LiveKit_Enabled_Description',
					});

					const livekitEnabled = { _id: 'VoIP_TeamCollab_LiveKit_Enabled', value: true };

					await this.add('VoIP_TeamCollab_LiveKit_Mode', 'self_hosted', {
						type: 'select',
						values: [
							{ key: 'self_hosted', i18nLabel: 'Self_hosted' },
							{ key: 'cloud', i18nLabel: 'LiveKit_Cloud' },
						],
						public: true,
						invalidValue: 'self_hosted',
						enableQuery: [livekitEnabled],
					});

					await this.add('VoIP_TeamCollab_LiveKit_Url', '', {
						type: 'string',
						public: true,
						invalidValue: '',
						enableQuery: [livekitEnabled],
					});

					await this.add('VoIP_TeamCollab_LiveKit_Api_Key', '', {
						type: 'string',
						secret: true,
						invalidValue: '',
						enableQuery: [livekitEnabled],
					});

					await this.add('VoIP_TeamCollab_LiveKit_Api_Secret', '', {
						type: 'password',
						secret: true,
						invalidValue: '',
						enableQuery: [livekitEnabled],
					});

					await this.add('VoIP_TeamCollab_LiveKit_Recording_Enabled', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						enableQuery: [livekitEnabled],
					});

					const recordingEnabled = { _id: 'VoIP_TeamCollab_LiveKit_Recording_Enabled', value: true };

					await this.add('VoIP_TeamCollab_LiveKit_Recording_Storage', 's3', {
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

					const localStorage = { _id: 'VoIP_TeamCollab_LiveKit_Recording_Storage', value: 'local' };

					await this.add('VoIP_TeamCollab_LiveKit_Recording_Local_Path', '/out', {
						type: 'string',
						invalidValue: '/out',
						i18nDescription: 'VoIP_TeamCollab_LiveKit_Recording_Local_Path_Description',
						enableQuery: [livekitEnabled, recordingEnabled, localStorage],
					});

					await this.add('VoIP_TeamCollab_LiveKit_Recording_Use_FileUpload_S3', false, {
						type: 'boolean',
						invalidValue: false,
						i18nDescription: 'VoIP_TeamCollab_LiveKit_Recording_Use_FileUpload_S3_Description',
						enableQuery: [livekitEnabled, recordingEnabled],
					});

					const useFileUploadS3 = { _id: 'VoIP_TeamCollab_LiveKit_Recording_Use_FileUpload_S3', value: false };

					await this.add('VoIP_TeamCollab_LiveKit_Recording_S3_Bucket', '', {
						type: 'string',
						invalidValue: '',
						enableQuery: [livekitEnabled, recordingEnabled, useFileUploadS3],
					});

					await this.add('VoIP_TeamCollab_LiveKit_Recording_S3_Region', 'us-east-1', {
						type: 'string',
						invalidValue: 'us-east-1',
						enableQuery: [livekitEnabled, recordingEnabled, useFileUploadS3],
					});

					await this.add('VoIP_TeamCollab_LiveKit_Recording_S3_Access_Key', '', {
						type: 'string',
						secret: true,
						invalidValue: '',
						enableQuery: [livekitEnabled, recordingEnabled, useFileUploadS3],
					});

					await this.add('VoIP_TeamCollab_LiveKit_Recording_S3_Secret_Key', '', {
						type: 'password',
						secret: true,
						invalidValue: '',
						enableQuery: [livekitEnabled, recordingEnabled, useFileUploadS3],
					});

					await this.add('VoIP_TeamCollab_LiveKit_Recording_S3_Endpoint', '', {
						type: 'string',
						invalidValue: '',
						enableQuery: [livekitEnabled, recordingEnabled, useFileUploadS3],
					});
				});

				await this.section('VoIP_TeamCollab_SIP_Integration', async function () {
					await this.add('VoIP_TeamCollab_SIP_Integration_Enabled', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
					});

					await this.add('VoIP_TeamCollab_SIP_Integration_For_Internal_Calls', false, {
						type: 'boolean',
						public: true,
						invalidValue: false,
						alert: 'VoIP_TeamCollab_Internal_SIP_Beta_Alert',
					});

					await this.add('VoIP_TeamCollab_Drachtio_Host', '', {
						type: 'string',
						public: false,
						invalidValue: '',
					});

					await this.add('VoIP_TeamCollab_Drachtio_Port', 9022, {
						type: 'int',
						public: false,
						invalidValue: 9022,
					});

					await this.add('VoIP_TeamCollab_Drachtio_Password', '', {
						type: 'password',
						secret: true,
						invalidValue: '',
					});

					await this.add('VoIP_TeamCollab_SIP_Server_Host', '', {
						type: 'string',
						public: false,
						invalidValue: '',
					});

					await this.add('VoIP_TeamCollab_SIP_Server_Port', 5060, {
						type: 'int',
						public: false,
						invalidValue: 5060,
					});
				});
			},
		);
	});
}
