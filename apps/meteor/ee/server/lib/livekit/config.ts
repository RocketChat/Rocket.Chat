import { settings } from '../../../../app/settings/server';

export type LiveKitConfig = {
	enabled: boolean;
	mode: 'self_hosted' | 'cloud';
	url: string;
	apiKey: string;
	apiSecret: string;
	recording: {
		enabled: boolean;
		storage: 'local' | 's3' | 'filestore' | 'both';
		localPath: string;
		s3: {
			bucket: string;
			region: string;
			accessKey: string;
			secretKey: string;
			endpoint: string;
		};
	};
};

export function getLiveKitConfig(): LiveKitConfig {
	return {
		enabled: settings.get<boolean>('VoIP_TeamCollab_LiveKit_Enabled'),
		mode: (settings.get<string>('VoIP_TeamCollab_LiveKit_Mode') as 'self_hosted' | 'cloud') || 'self_hosted',
		url: settings.get<string>('VoIP_TeamCollab_LiveKit_Url') || '',
		apiKey: settings.get<string>('VoIP_TeamCollab_LiveKit_Api_Key') || '',
		apiSecret: settings.get<string>('VoIP_TeamCollab_LiveKit_Api_Secret') || '',
		recording: {
			enabled: settings.get<boolean>('VoIP_TeamCollab_LiveKit_Recording_Enabled'),
			storage: (settings.get<string>('VoIP_TeamCollab_LiveKit_Recording_Storage') as LiveKitConfig['recording']['storage']) || 's3',
			localPath: settings.get<string>('VoIP_TeamCollab_LiveKit_Recording_Local_Path') || '/out',
			s3: {
				bucket: settings.get<string>('VoIP_TeamCollab_LiveKit_Recording_S3_Bucket') || '',
				region: settings.get<string>('VoIP_TeamCollab_LiveKit_Recording_S3_Region') || 'us-east-1',
				accessKey: settings.get<string>('VoIP_TeamCollab_LiveKit_Recording_S3_Access_Key') || '',
				secretKey: settings.get<string>('VoIP_TeamCollab_LiveKit_Recording_S3_Secret_Key') || '',
				endpoint: settings.get<string>('VoIP_TeamCollab_LiveKit_Recording_S3_Endpoint') || '',
			},
		},
	};
}

export function isLiveKitFullyConfigured(): boolean {
	const cfg = getLiveKitConfig();
	if (!cfg.enabled) {
		return false;
	}
	if (!cfg.url || !cfg.apiKey || !cfg.apiSecret) {
		return false;
	}
	if (cfg.recording.enabled) {
		if (cfg.recording.storage === 's3' || cfg.recording.storage === 'both') {
			const { bucket, accessKey, secretKey } = cfg.recording.s3;
			if (!bucket || !accessKey || !secretKey) {
				return false;
			}
		}
		if (cfg.recording.storage === 'local' && !cfg.recording.localPath) {
			return false;
		}
	}
	return true;
}
