import nacl from 'tweetnacl';
import { toBinaryData, toUnpaddedBase64 } from './binaryData';
import type { SigningKey } from './keys';
import type { EventBase } from './core/events/eventBase';
import type { IdAndEvent } from './procedures/createRoom';

export enum EncryptionValidAlgorithm {
	ed25519 = 'ed25519',
}

export type ProtocolVersionKey = `${EncryptionValidAlgorithm}:${string}`;

export type SignedEvent<T extends IdAndEvent<EventBase>> = T & {
	signatures: {
		[key: string]: {
			[key: string]: string;
		};
	};
};

export type SignedJson<T extends object> = T & {
	signatures: {
		[key: string]: {
			[key: string]: string;
		};
	};
};

export async function signJson<
	T extends object & {
		signatures?: Record<string, Record<string, string>>;
		unsigned?: Record<string, any>;
	},
>(
	jsonObject: T,
	signingKey: SigningKey,
	signingName: string,
): Promise<SignedJson<T>> {
	const keyId: ProtocolVersionKey = `${signingKey.algorithm}:${signingKey.version}`;
	const { signatures = {}, unsigned, ...rest } = jsonObject;

	const data = encodeCanonicalJson(rest);

	const signed = await signingKey.sign(toBinaryData(data));

	const name = signingName;

	const signature = signatures[name] || {};

	Object.assign(signatures, {
		[name]: {
			...signature,
			[keyId]: toUnpaddedBase64(signed),
		},
	});

	return {
		...jsonObject,
		signatures,
	};
}

export const isValidAlgorithm = (
	algorithm: string,
): algorithm is EncryptionValidAlgorithm => {
	return Object.values(EncryptionValidAlgorithm).includes(algorithm as any);
};

// Checking for a Signature
// To check if an entity has signed a JSON object an implementation does the following:

// Checks if the signatures member of the object contains an entry with the name of the entity. If the entry is missing then the check fails.
// Removes any signing key identifiers from the entry with algorithms it doesn’t understand. If there are no signing key identifiers left then the check fails.
// Looks up verification keys for the remaining signing key identifiers either from a local cache or by consulting a trusted key server. If it cannot find a verification key then the check fails.
// Decodes the base64 encoded signature bytes. If base64 decoding fails then the check fails.
// Removes the signatures and unsigned members of the object.
// Encodes the remainder of the JSON object using the Canonical JSON encoding.
// Checks the signature bytes against the encoded object using the verification key. If this fails then the check fails. Otherwise the check succeeds.

export async function getSignaturesFromRemote<
	T extends object & {
		signatures?: Record<string, Record<ProtocolVersionKey, string>>;
		unsigned?: unknown;
	},
>(jsonObject: T, signingName: string) {
	const { signatures, unsigned: _unsigned } = jsonObject;

	const remoteSignatures =
		signatures?.[signingName] &&
		Object.entries(signatures[signingName])
			.map(([keyId, signature]) => {
				const [algorithm, version] = keyId.split(':');
				if (!isValidAlgorithm(algorithm)) {
					throw new Error(`Invalid algorithm ${algorithm} for ${signingName}`);
				}

				return {
					algorithm,
					version,
					signature,
				};
			})
			.filter(({ algorithm }) =>
				Object.values(EncryptionValidAlgorithm).includes(algorithm as any),
			);

	if (!remoteSignatures?.length) {
		throw new Error(`Signatures not found for ${signingName}`);
	}

	return remoteSignatures;
}

export const verifySignature = (
	content: string,
	signingName: string,
	signature: Uint8Array,
	publicKey: Uint8Array,
	algorithm: EncryptionValidAlgorithm,
	_version?: string,
) => {
	if (algorithm !== EncryptionValidAlgorithm.ed25519) {
		throw new Error(`Invalid algorithm ${algorithm} for ${signingName}`);
	}

	if (
		!nacl.sign.detached.verify(
			new TextEncoder().encode(content),
			signature,
			publicKey,
		)
	) {
		throw new Error(`Invalid signature for ${signingName}`);
	}
	return true;
};

export const verifyJsonSignature = <T extends object>(
	content: T,
	signingName: string,
	signature: Uint8Array,
	publicKey: Uint8Array,
	algorithm: EncryptionValidAlgorithm,
	version?: string,
) => {
	const { signatures: _, unsigned: _unsigned, ...__rest } = content as any;
	const canonicalJson = encodeCanonicalJson(__rest);

	return verifySignature(
		canonicalJson,
		signingName,
		signature,
		publicKey,
		algorithm,
		version,
	);
};

// Alias for backward compatibility
export const verifySignedJson = verifyJsonSignature;

export async function verifySignaturesFromRemote<
	T extends object & {
		signatures?: Record<string, Record<ProtocolVersionKey, string>>;
		unsigned?: unknown;
	},
>(
	jsonObject: T,
	signingName: string,
	getPublicKey: (
		algorithm: EncryptionValidAlgorithm,
		version: string,
	) => Promise<Uint8Array>,
) {
	const { signatures: _, unsigned: _unsigned, ...__rest } = jsonObject;

	const canonicalJson = encodeCanonicalJson(__rest);

	const signatures = await getSignaturesFromRemote(jsonObject, signingName);

	for await (const { algorithm, version, signature } of signatures) {
		const publicKey = await getPublicKey(
			algorithm as EncryptionValidAlgorithm,
			version,
		);

		if (
			!nacl.sign.detached.verify(
				new TextEncoder().encode(canonicalJson),
				new Uint8Array(Buffer.from(signature, 'base64')),
				publicKey,
			)
		) {
			throw new Error(`Invalid signature for ${signingName}`);
		}
	}

	return true;
}

export function encodeCanonicalJson(value: unknown): string {
	if (value === null || typeof value !== 'object') {
		// Handle primitive types and null
		return JSON.stringify(value);
	}

	if (Array.isArray(value)) {
		// Handle arrays recursively
		const serializedArray = value.map(encodeCanonicalJson);
		return `[${serializedArray.join(',')}]`;
	}

	// Handle objects: sort keys lexicographically
	const sortedKeys = Object.keys(value).sort();
	const serializedEntries = sortedKeys.map(
		(key) =>
			`"${key}":${encodeCanonicalJson((value as Record<string, unknown>)[key])}`,
	);
	return `{${serializedEntries.join(',')}}`;
}

export async function signText(
	data: string | Uint8Array,
	signingKey: Uint8Array,
) {
	if (typeof data === 'string') {
		return nacl.sign.detached(toBinaryData(data), signingKey);
	}

	return nacl.sign.detached(data, signingKey);
}
