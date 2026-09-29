import { settings } from '../../../../server/settings';

export type LiveKitConfig = {
	enabled: boolean;
	url: string;
	apiKey: string;
	apiSecret: string;
	tokenTtlHours: number;
};

export function getLiveKitConfig(): LiveKitConfig {
	return {
		enabled: settings.get<boolean>('VideoConf_LiveKit_Enabled'),
		url: settings.get<string>('VideoConf_LiveKit_Url') || '',
		apiKey: settings.get<string>('VideoConf_LiveKit_Api_Key') || '',
		apiSecret: settings.get<string>('VideoConf_LiveKit_Api_Secret') || '',
		tokenTtlHours: settings.get<number>('VideoConf_LiveKit_Token_TTL') || 6,
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
