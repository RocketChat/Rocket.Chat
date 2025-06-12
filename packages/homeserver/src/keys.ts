import nacl from 'tweetnacl';
import { toUnpaddedBase64 } from './binaryData';
import { EncryptionValidAlgorithm, signText } from './signJson';

export type SigningKey = {
	algorithm: EncryptionValidAlgorithm;
	version: string;
	privateKey: Uint8Array;
	publicKey: Uint8Array;
	sign(data: Uint8Array): Promise<Uint8Array>;
};

export async function generateKeyPairs(
	seed: Uint8Array,
	algorithm = EncryptionValidAlgorithm.ed25519,
	version = '0',
): Promise<SigningKey> {
	// Generate an Ed25519 key pair
	const keyPair = await nacl.sign.keyPair.fromSeed(seed);

	// Encode the private key to Base64

	return {
		version,
		privateKey: keyPair.secretKey,
		publicKey: keyPair.publicKey,
		algorithm,
		sign(data: Uint8Array) {
			return signText(data, keyPair.secretKey);
		},
	};
}

export async function generateKeyPairsFromString(content: string) {
	const [algorithm, version, seed] = content.trim().split(' ');

	return await generateKeyPairs(
		Uint8Array.from(atob(seed), (c) => c.charCodeAt(0)),
		algorithm as EncryptionValidAlgorithm,
		version,
	);
}

async function storeKeyPairs(
	seeds: {
		algorithm: string;
		version: string;
		seed: Uint8Array;
	}[],
	path: string,
) {
	for await (const keyPair of seeds) {
		await Bun.write(
			path,
			`${keyPair.algorithm} ${keyPair.version} ${toUnpaddedBase64(keyPair.seed)}`,
		);
	}
}

export const getKeyPair = async (config: {
	signingKeyPath: string;
}): Promise<SigningKey[]> => {
	const { signingKeyPath } = config;

	const hasStoredKeys = await Bun.file(signingKeyPath).exists();

	const seeds = [];

	if (!hasStoredKeys) {
		seeds.push({
			algorithm: 'ed25519' as EncryptionValidAlgorithm,
			version: '0',
			seed: nacl.randomBytes(32),
		});

		await storeKeyPairs(seeds, signingKeyPath);
	}

	if (hasStoredKeys) {
		const [algorithm, version, seed] = (
			await Bun.file(config.signingKeyPath).text()
		)
			.trim()
			.split(' ');
		seeds.push({
			algorithm: algorithm as EncryptionValidAlgorithm,
			version,
			seed: Uint8Array.from(atob(seed), (c) => c.charCodeAt(0)),
		});
	}

	return Promise.all(
		seeds.map(
			async (seed) =>
				await generateKeyPairs(seed.seed, seed.algorithm, seed.version),
		),
	);
};
