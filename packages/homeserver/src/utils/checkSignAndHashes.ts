import { EncryptionValidAlgorithm, verifyJsonSignature } from '../signJson';
import type { SignedEvent } from '../signEvent';
import { createLogger } from './logger';

const logger = createLogger('checkSignAndHashes');

export interface VerificationResult {
	verified: boolean;
	error?: string;
}

import { computeHash, type HashedEvent } from '../authentication';
import { MatrixError } from '../errors';
import { pruneEventDict } from '../pruneEventDict';
import { getSignaturesFromRemote } from '../signJson';
import { EventBase } from '../core/events/eventBase';

export async function checkSignAndHashes(
	pdu: HashedEvent<Record<string, unknown>>,
	origin: string,
	getPublicKeyFromServer: (origin: string, key: string) => Promise<string>,
) {
	const [signature] = await getSignaturesFromRemote(pdu, origin);
	const publicKey = await getPublicKeyFromServer(
		origin,
		`${signature.algorithm}:${signature.version}`,
	);

	if (
		!verifyJsonSignature(
			pruneEventDict(pdu as unknown as EventBase),
			origin,
			Uint8Array.from(atob(signature.signature), (c) => c.charCodeAt(0)),
			Uint8Array.from(atob(publicKey), (c) => c.charCodeAt(0)),
			signature.algorithm,
			signature.version,
		)
	) {
		throw new MatrixError('400', 'Invalid signature');
	}

	const [algorithm, hash] = computeHash(pdu);

	const expectedHash = pdu.hashes[algorithm];

	if (hash !== expectedHash) {
		logger.error('Invalid hash', hash, expectedHash);
		throw new MatrixError('400', 'Invalid hash');
	}

	return pdu;
}

export async function checkEventSignatures(
	event: SignedEvent<any>,
	publicKeys: Map<string, string>
): Promise<VerificationResult> {
	try {
		// Check if event has required fields
		if (!event.signatures || !event.origin) {
			return {
				verified: false,
				error: 'Event missing signatures or origin',
			};
		}

		// Get the server's signature
		const serverSignatures = event.signatures[event.origin];
		if (!serverSignatures) {
			return {
				verified: false,
				error: `No signatures found for origin server ${event.origin}`,
			};
		}

		// Verify each signature
		for (const [keyId, signature] of Object.entries(serverSignatures)) {
			const publicKey = publicKeys.get(`${event.origin}:${keyId}`);
			if (!publicKey) {
				logger.warn(`Public key not found for ${event.origin}:${keyId}`);
				continue;
			}

			// Verify the signature
			const isValid = await verifyJsonSignature(
				event,
				event.origin,
				Uint8Array.from(atob(signature as string), (c) => c.charCodeAt(0)),
				Uint8Array.from(atob(publicKey as string), (c) => c.charCodeAt(0)),
				EncryptionValidAlgorithm.ed25519,
			);

			if (isValid) {
				return { verified: true };
			}
		}

		return {
			verified: false,
			error: 'No valid signatures found',
		};
	} catch (error) {
		logger.error('Error checking event signatures', error);
		return {
			verified: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function checkEventHashes(_event: SignedEvent<any>): Promise<boolean> {
	// TODO: Implement hash checking
	// For now, just return true
	return true;
}