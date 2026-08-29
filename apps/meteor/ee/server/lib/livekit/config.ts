import { settings } from '../../../../server/settings';

export type LiveKitConfig = {
	enabled: boolean;
	mode: 'self_hosted' | 'cloud';
	url: string;
	apiKey: string;
	apiSecret: string;
};

export function getLiveKitConfig(): LiveKitConfig {
	return {
		enabled: settings.get<boolean>('VideoConf_LiveKit_Enabled'),
		mode: (settings.get<string>('VideoConf_LiveKit_Mode') as 'self_hosted' | 'cloud') || 'self_hosted',
		url: settings.get<string>('VideoConf_LiveKit_Url') || '',
		apiKey: settings.get<string>('VideoConf_LiveKit_Api_Key') || '',
		apiSecret: settings.get<string>('VideoConf_LiveKit_Api_Secret') || '',
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
	return true;
}
