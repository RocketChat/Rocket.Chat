import { Session } from '../Session';

export class ClientSession extends Session {
	async init(): Promise<string> {
		const sodium = await this.sodium();

		const clientKeypair = await sodium.crypto_box_keypair();
		this.secretKey = await sodium.crypto_box_secretkey(clientKeypair);
		this.publicKey = await sodium.crypto_box_publickey(clientKeypair);

		return this.publicKey.toString(this.stringFormatKey);
	}

	async setServerKey(serverPublic: string): Promise<void> {
		const sodium = await this.sodium();

		const [decryptKey, encryptKey] = await sodium.crypto_kx_client_session_keys(
			this.publicKey,
			this.secretKey,
			this.publicKeyFromString(serverPublic),
		);

		this.decryptKey = decryptKey;
		this.encryptKey = encryptKey;
	}
}
