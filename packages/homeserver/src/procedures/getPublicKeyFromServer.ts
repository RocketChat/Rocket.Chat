import type { ServerKey } from '../core/server';
import { makeRequest } from '../makeRequest';
import {
	getSignaturesFromRemote,
	isValidAlgorithm,
	verifyJsonSignature,
} from '../signJson';

export const makeGetPublicKeyFromServerProcedure = (
	getFromLocal: (origin: string, key: string) => Promise<string | undefined>,
	getFromOrigin: (
		origin: string,
		key: string,
	) => Promise<{ key: string; validUntil: number }>,
	store: (
		origin: string,
		key: string,
		value: string,
		validUntil: number,
	) => Promise<void>,
) => {
	return async (origin: string, key: string) => {
		const localPublicKey = await getFromLocal(origin, key);
		if (localPublicKey) {
			return localPublicKey;
		}

		const { key: remotePublicKey, validUntil } = await getFromOrigin(
			origin,
			key,
		);
		if (remotePublicKey) {
			await store(origin, key, remotePublicKey, validUntil);
			return remotePublicKey;
		}

		throw new Error('Public key not found');
	};
};

export const getPublicKeyFromRemoteServer = async (
	domain: string,
	origin: string,
	algorithmAndVersion: string,
) => {
	const [algorithm, version] = algorithmAndVersion.split(':');
	if (!algorithm || !version) {
		throw new Error('Invalid algorithm and version format');
	}

	if (!isValidAlgorithm(algorithm)) {
		throw new Error('Invalid algorithm');
	}

	const result = await makeRequest<ServerKey>({
		method: 'GET',
		domain,
		uri: '/_matrix/key/v2/server',
		signingName: origin,
	});

	if (result.valid_until_ts < Date.now()) {
		throw new Error('Expired remote public key');
	}

	const publickey = result.verify_keys[algorithmAndVersion]?.key;
	if (!publickey) {
		throw new Error('Public key not found');
	}

	const [signature] = await getSignaturesFromRemote(result, domain);
	if (!signature) {
		throw new Error(`No valid signature found for ${domain}`);
	}

	const publicKeyBytes = Uint8Array.from(atob(publickey), (c) =>
		c.charCodeAt(0),
	);
	const signatureBytes = Uint8Array.from(atob(signature.signature), (c) =>
		c.charCodeAt(0),
	);

	if (
		!verifyJsonSignature(
			result,
			domain,
			signatureBytes,
			publicKeyBytes,
			signature.algorithm,
			signature.version,
		)
	) {
		throw new Error('Invalid signature');
	}

	return {
		key: publickey,
		validUntil: result.valid_until_ts,
	};
};
