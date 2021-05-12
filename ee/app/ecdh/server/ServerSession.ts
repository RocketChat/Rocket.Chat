import { Session } from '../Session';

export type ProcessString = (text: string[]) => string;
export type ProcessBuffer = (text: Buffer) => Buffer[];

export class ServerSession extends Session {
	async init(clientPublic: string): Promise<void> {
		const sodium = await this.sodium();

		const staticSeed = process.env.STATIC_SEED;

		if (!staticSeed?.trim()) {
			console.error('STATIC_SEED environment variable is required');
			process.exit(1);
		}

		const serverKeypair = await sodium.crypto_kx_seed_keypair(staticSeed + clientPublic);
		this.secretKey = await sodium.crypto_box_secretkey(serverKeypair);
		this.publicKey = await sodium.crypto_box_publickey(serverKeypair);

		const [decryptKey, encryptKey] = await sodium.crypto_kx_server_session_keys(
			this.publicKey,
			this.secretKey,
			this.publicKeyFromString(clientPublic),
		);

		this.decryptKey = decryptKey;
		this.encryptKey = encryptKey;
	}
}
