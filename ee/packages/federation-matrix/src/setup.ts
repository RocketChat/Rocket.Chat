import { federationSDK, init } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';

import { registerEvents } from './events';

const logger = new Logger('FederationSetup');

function validateDomain(domain: string): boolean {
	const value = domain.trim();

	if (!value) {
		logger.error('The Federation domain is not set');
		return false;
	}

	if (value.toLowerCase() !== value) {
		logger.error(`The Federation domain "${value}" cannot have uppercase letters`);
		return false;
	}

	try {
		const valid = new URL(`https://${value}`).hostname === value;

		if (!valid) {
			throw new Error();
		}
	} catch {
		logger.error(`The configured Federation domain "${value}" is not valid`);
		return false;
	}

	return true;
}

export function configureFederationMatrixSettings(settings: {
	instanceId: string;
	domain: string;
	signingKey: string;
	signingAlgorithm: string;
	signingVersion: string;
	allowedEncryptedRooms: boolean;
	allowedNonPrivateRooms: boolean;
	processEDUTyping: boolean;
	processEDUPresence: boolean;
}) {
	const {
		instanceId,
		domain: serverName,
		signingKey,
		signingAlgorithm: signingAlg,
		signingVersion,
		allowedEncryptedRooms,
		allowedNonPrivateRooms,
		processEDUTyping,
		processEDUPresence,
	} = settings;

	if (!validateDomain(serverName)) {
		throw new Error('Invalid Federation domain');
	}

	federationSDK.setConfig({
		instanceId,
		serverName,
		keyRefreshInterval: Number.parseInt(process.env.MATRIX_KEY_REFRESH_INTERVAL || '60', 10),
		matrixDomain: serverName,
		version: process.env.SERVER_VERSION || '1.0',
		port: Number.parseInt(process.env.SERVER_PORT || '8080', 10),
		signingKey: `${signingAlg} ${signingVersion} ${signingKey}`,
		signingKeyPath: '', // TODO remove
		media: {
			maxFileSize: Number.parseInt(process.env.MEDIA_MAX_FILE_SIZE || '100', 10) * 1024 * 1024,
			allowedMimeTypes: process.env.MEDIA_ALLOWED_MIME_TYPES?.split(',') || [
				'image/jpeg',
				'image/png',
				'image/gif',
				'image/webp',
				'text/plain',
				'application/pdf',
				'video/mp4',
				'audio/mpeg',
				'audio/ogg',
			],
			enableThumbnails: process.env.MEDIA_ENABLE_THUMBNAILS !== 'true',
			rateLimits: {
				uploadPerMinute: Number.parseInt(process.env.MEDIA_UPLOAD_RATE_LIMIT || '10', 10),
				downloadPerMinute: Number.parseInt(process.env.MEDIA_DOWNLOAD_RATE_LIMIT || '60', 10),
			},
		},
		invite: {
			allowedEncryptedRooms,
			allowedNonPrivateRooms,
		},
		edu: {
			processTyping: processEDUTyping,
			processPresence: processEDUPresence,
		},
	});
}

export async function setupFederationMatrix() {
	await init({
		dbConfig: {
			uri: process.env.MONGO_URL || 'mongodb://localhost:3001/meteor',
			poolSize: Number.parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
		},
	});

	registerEvents();
}
