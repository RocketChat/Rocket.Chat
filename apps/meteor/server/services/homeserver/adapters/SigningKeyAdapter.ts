import { injectable, singleton } from 'tsyringe';
import { Settings } from '@rocket.chat/models';
import * as crypto from 'crypto';

/**
 * Adapter to manage Matrix signing keys within Rocket.Chat
 * Stores keys in Rocket.Chat's settings instead of files
 */
@injectable()
@singleton()
export class SigningKeyAdapter {
	private signingKey: string | null = null;
	private readonly SETTING_KEY = 'Federation_Matrix_Signing_Key';

	/**
	 * Get or generate the signing key for Matrix federation
	 */
	async getSigningKey(): Promise<string> {
		if (this.signingKey) {
			return this.signingKey;
		}

		// Try to load from database
		const setting = await Settings.findOneById(this.SETTING_KEY);
		if (setting?.value) {
			this.signingKey = setting.value as string;
			return this.signingKey;
		}

		// Generate new key if none exists
		this.signingKey = await this.generateSigningKey();
		await this.saveSigningKey(this.signingKey);
		
		return this.signingKey;
	}

	/**
	 * Generate a new Ed25519 signing key
	 */
	private async generateSigningKey(): Promise<string> {
		// In production, this should use proper Ed25519 key generation
		// For now, using a placeholder
		const keyPair = crypto.generateKeyPairSync('ed25519', {
			privateKeyEncoding: {
				type: 'pkcs8',
				format: 'pem',
			},
			publicKeyEncoding: {
				type: 'spki',
				format: 'pem',
			},
		});

		// Convert to Matrix signing key format
		// This is a simplified version - real implementation needs proper encoding
		return Buffer.from(keyPair.privateKey).toString('base64');
	}

	/**
	 * Save signing key to Rocket.Chat settings
	 */
	private async saveSigningKey(key: string): Promise<void> {
		await Settings.updateOne(
			{ _id: this.SETTING_KEY },
			{
				$set: {
					_id: this.SETTING_KEY,
					value: key,
					type: 'string',
					group: 'Federation',
					section: 'Matrix',
					hidden: true,
					secret: true,
				},
			},
			{ upsert: true }
		);
	}

	/**
	 * Get the server name from Rocket.Chat settings
	 */
	async getServerName(): Promise<string> {
		const setting = await Settings.findOneById('Federation_Domain');
		return setting?.value as string || 'localhost';
	}

	/**
	 * Get key ID for Matrix federation
	 */
	async getKeyId(): Promise<string> {
		// Matrix uses format like "ed25519:keyid"
		return `ed25519:${await this.generateKeyId()}`;
	}

	private async generateKeyId(): Promise<string> {
		// Generate a stable key ID based on server name
		const serverName = await this.getServerName();
		const hash = crypto.createHash('sha256').update(serverName).digest('hex');
		return hash.substring(0, 8);
	}
}