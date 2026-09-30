import { settings } from '../../../../server/settings';

export type LiveKitConfig = {
	enabled: boolean;
	url: string;
	apiKey: string;
	apiSecret: string;
	tokenTtlHours: number;
};

const DEFAULT_TOKEN_TTL_HOURS = 6;

export function getLiveKitConfig(): LiveKitConfig {
	const tokenTtlHours = settings.get<number>('VideoConf_LiveKit_Token_TTL');

	return {
		enabled: settings.get<boolean>('VideoConf_LiveKit_Enabled'),
		url: (settings.get<string>('VideoConf_LiveKit_Url') || '').trim(),
		apiKey: (settings.get<string>('VideoConf_LiveKit_Api_Key') || '').trim(),
		apiSecret: (settings.get<string>('VideoConf_LiveKit_Api_Secret') || '').trim(),
		// A lifetime of zero or less would mint tokens that are already expired.
		tokenTtlHours: tokenTtlHours > 0 ? tokenTtlHours : DEFAULT_TOKEN_TTL_HOURS,
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
