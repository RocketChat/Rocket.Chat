import type { ProtocolVersionKey } from '../../signJson';
import { createLogger } from '../../utils/logger';
import * as nacl from 'tweetnacl';
import { injectable } from 'tsyringe';

interface KeyData {
	server_name: string;
	verify_keys: {
		[keyId: string]: {
			key: string;
		};
	};
	old_verify_keys?: {
		[keyId: string]: {
			key: string;
			expired_ts: number;
		};
	};
}

@injectable()
export class SignatureVerificationService {
	private readonly logger = createLogger('SignatureVerificationService');
	private cachedKeys = new Map<string, KeyData>();

	/**
	 * Verify a signature from a remote server
	 */
	async verifySignature<
		T extends object & {
			signatures?: Record<string, Record<ProtocolVersionKey, string>>;
			unsigned?: unknown;
		},
	>(
		event: T,
		originServer: string,
		getPublicKeyFn?: (origin: string, keyId: string) => Promise<string>,
	): Promise<boolean> {
		try {
			if (!event.signatures || !event.signatures[originServer]) {
				this.logger.warn(`No signature found for ${originServer}`);
				return false;
			}

			const signatureObj = event.signatures[originServer];

			const entries = Object.entries(signatureObj);
			if (entries.length === 0) {
				this.logger.warn(`No signature keys found for ${originServer}`);
				return false;
			}

			const [keyId, signature] = entries[0];

			if (!keyId || !signature) {
				this.logger.warn(`Invalid signature data for ${originServer}`);
				return false;
			}

			let publicKey: string;

			if (getPublicKeyFn) {
				publicKey = await getPublicKeyFn(originServer, keyId);
			} else {
				const keyData = await this.getOrFetchPublicKey(originServer, keyId);
				if (!keyData || !keyData.verify_keys[keyId]) {
					this.logger.warn(`Public key not found for ${originServer}:${keyId}`);
					return false;
				}
				publicKey = keyData.verify_keys[keyId].key;
			}

			const { signatures, unsigned, ...eventToVerify } = event;

			const canonicalJson = JSON.stringify(eventToVerify);

			const publicKeyUint8 = Buffer.from(publicKey, 'base64');
			const signatureUint8 = Buffer.from(signature, 'base64');

			return nacl.sign.detached.verify(
				Buffer.from(canonicalJson),
				signatureUint8,
				publicKeyUint8,
			);
		} catch (error: any) {
			this.logger.error(
				`Error verifying signature: ${error.message}`,
				error.stack,
			);
			return false;
		}
	}

	/**
	 * Get public key from cache or fetch it from the server
	 */
	private async getOrFetchPublicKey(
		serverName: string,
		keyId: string,
	): Promise<KeyData | null | undefined> {
		const cacheKey = `${serverName}:${keyId}`;

		if (this.cachedKeys.has(cacheKey)) {
			return this.cachedKeys.get(cacheKey);
		}

		try {
			const response = await fetch(
				`https://${serverName}/_matrix/key/v2/server`,
			);

			if (!response.ok) {
				this.logger.error(
					`Failed to fetch keys from ${serverName}: ${response.status}`,
				);
				return null;
			}

			const keyData = (await response.json()) as KeyData;

			this.cachedKeys.set(cacheKey, keyData);

			return keyData;
		} catch (error: any) {
			this.logger.error(
				`Error fetching public key: ${error.message}`,
				error.stack,
			);
			return null;
		}
	}
}
