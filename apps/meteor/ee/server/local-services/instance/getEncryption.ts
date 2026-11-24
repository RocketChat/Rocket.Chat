import { createHash } from 'node:crypto';

import { Middlewares } from 'moleculer';

const createEncryptionMiddleware = Middlewares.Transmit.Encryption;

const SECRET_VARIABLE = 'MOLECULER_ENCRYPTION_SECRET';

export type ClusterTransportKind = 'tcp' | 'nats' | 'microservices';

export function getEncryption({ [SECRET_VARIABLE]: secret }: Record<string, unknown> = {}) {
	if (!secret || typeof secret !== 'string') {
		return {};
	}

	const key = createHash('sha256').update(`key:${secret}`).digest();
	const iv = createHash('sha256').update(`iv:${secret}`).digest().subarray(0, 16);

	return {
		middlewares: [createEncryptionMiddleware(key, 'aes-256-cbc', iv)],
	};
}

export function getEncryptionWarning(secret: unknown, transport: ClusterTransportKind): string | undefined {
	const enabled = typeof secret === 'string' && secret.length > 0;

	if (transport === 'microservices') {
		return enabled ? `${SECRET_VARIABLE} is ignored in microservices mode: Moleculer traffic is NOT encrypted.` : undefined;
	}

	if (enabled) {
		return undefined;
	}

	const reason = secret === '' ? `${SECRET_VARIABLE} is set but empty` : `${SECRET_VARIABLE} is not set`;

	if (transport === 'tcp') {
		return `${reason}: the Moleculer TCP port accepts unauthenticated packets from anyone who can reach it.`;
	}

	return secret === '' ? `${reason}: Moleculer traffic is NOT encrypted.` : undefined;
}
