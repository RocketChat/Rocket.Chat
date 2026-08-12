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
	recorder?: boolean;
	ingressAdmin?: boolean;
	roomAdmin?: boolean;
	roomCreate?: boolean;
	roomList?: boolean;
	roomRecord?: boolean;
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

// Token used by the server itself to call LiveKit's HTTP API (RoomService, Egress).
export async function createLiveKitApiToken(grant: VideoGrant): Promise<string> {
	const cfg = getLiveKitConfig();
	if (!cfg.apiKey || !cfg.apiSecret) {
		throw new Error('LiveKit API credentials are not configured');
	}
	return signHS256(
		{ video: grant },
		{
			secret: cfg.apiSecret,
			issuer: cfg.apiKey,
			subject: cfg.apiKey,
			expiresIn: '10m',
			notBefore: 0,
		},
	);
}
