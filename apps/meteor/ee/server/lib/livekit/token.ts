import { signHS256 } from '@rocket.chat/jwt';

import { getLiveKitConfig } from './config';

// LiveKit access tokens are HS256 JWTs with a "video" grant claim.
// Reference: https://docs.livekit.io/home/get-started/authentication/
export type VideoGrant = {
	roomJoin?: boolean;
	room?: string;
	canPublish?: boolean;
	canSubscribe?: boolean;
	canPublishData?: boolean;
	canPublishSources?: ('camera' | 'microphone' | 'screen_share' | 'screen_share_audio')[];
	hidden?: boolean;
	ingressAdmin?: boolean;
	roomAdmin?: boolean;
	roomCreate?: boolean;
	roomList?: boolean;
};

export type AccessTokenInput = {
	identity: string;
	name?: string;
	metadata?: string;
	ttlSeconds?: number;
	grant: VideoGrant;
};

export async function createLiveKitAccessToken(input: AccessTokenInput): Promise<string> {
	const cfg = getLiveKitConfig();
	if (!cfg.apiKey || !cfg.apiSecret) {
		throw new Error('LiveKit API credentials are not configured');
	}

	const ttl = input.ttlSeconds ?? 6 * 60 * 60; // 6 hours default

	return signHS256(
		{
			video: input.grant,
			...(input.metadata ? { metadata: input.metadata } : {}),
			...(input.name ? { name: input.name } : {}),
		},
		{
			secret: cfg.apiSecret,
			issuer: cfg.apiKey,
			subject: input.identity,
			expiresIn: `${ttl}s`,
			notBefore: 0,
		},
	);
}
