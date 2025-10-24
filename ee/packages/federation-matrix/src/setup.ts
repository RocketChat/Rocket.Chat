import { License } from '@rocket.chat/core-services';
import { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures } from '@rocket.chat/federation-sdk';
import { ConfigService, createFederationContainer } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Settings } from '@rocket.chat/models';

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

export async function setupFederationMatrix(instanceId: string): Promise<boolean> {
	const settingEnabled = (await Settings.getValueById<boolean>('Federation_Service_Enabled')) || false;
	const serverName = (await Settings.getValueById<string>('Federation_Service_Domain')) || '';

	const processEDUTyping = (await Settings.getValueById<boolean>('Federation_Service_EDU_Process_Typing')) || false;
	const processEDUPresence = (await Settings.getValueById<boolean>('Federation_Service_EDU_Process_Presence')) || false;
	const signingKey = (await Settings.getValueById<string>('Federation_Service_Matrix_Signing_Key')) || '';
	const signingAlg = (await Settings.getValueById<string>('Federation_Service_Matrix_Signing_Algorithm')) || '';
	const signingVersion = (await Settings.getValueById<string>('Federation_Service_Matrix_Signing_Version')) || '';
	const allowedEncryptedRooms = (await Settings.getValueById<boolean>('Federation_Service_Join_Encrypted_Rooms')) || false;
	const allowedNonPrivateRooms = (await Settings.getValueById<boolean>('Federation_Service_Join_Non_Private_Rooms')) || false;

	// TODO are these required?
	const mongoUri = process.env.MONGO_URL || 'mongodb://localhost:3001/meteor';
	const dbName = process.env.DATABASE_NAME || new URL(mongoUri).pathname.slice(1);

	const config = new ConfigService({
		instanceId,
		serverName,
		keyRefreshInterval: Number.parseInt(process.env.MATRIX_KEY_REFRESH_INTERVAL || '60', 10),
		matrixDomain: serverName,
		version: process.env.SERVER_VERSION || '1.0',
		port: Number.parseInt(process.env.SERVER_PORT || '8080', 10),
		signingKey: `${signingAlg} ${signingVersion} ${signingKey}`,
		signingKeyPath: '', // TODO remove
		database: {
			uri: mongoUri,
			name: dbName,
			poolSize: Number.parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
		},
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
	});

	const eventHandler = new Emitter<HomeserverEventSignatures>();

	await createFederationContainer(
		{
			emitter: eventHandler,
		},
		config,
	);

	const serviceEnabled = (await License.hasModule('federation')) && settingEnabled && validateDomain(serverName);
	if (!serviceEnabled) {
		return false;
	}

	registerEvents(eventHandler, serverName, {
		typing: processEDUTyping,
		presence: processEDUPresence,
	});

	return true;
}
