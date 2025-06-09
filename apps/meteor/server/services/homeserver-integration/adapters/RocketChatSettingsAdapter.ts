import { injectable } from 'tsyringe';
import { settings } from '@rocket.chat/meteor';
import * as crypto from 'crypto';
import * as fs from 'fs';

/**
 * Adapter to provide homeserver with configuration from Rocket.Chat settings
 */
@injectable()
export class RocketChatSettingsAdapter {
	private cachedSigningKey: string | null = null;

	/**
	 * Get the server name (domain) for federation
	 */
	getServerName(): string {
		return settings.get('Federation_Domain') || 'localhost';
	}

	/**
	 * Get the port for federation
	 */
	getPort(): number {
		return settings.get('Federation_Port') || 8448;
	}

	/**
	 * Get or generate the signing key
	 */
	async getSigningKey(): Promise<string> {
		if (this.cachedSigningKey) {
			return this.cachedSigningKey;
		}

		// Try to get from settings
		const storedKey = settings.get('Federation_Matrix_Signing_Key');
		if (storedKey) {
			this.cachedSigningKey = storedKey;
			return storedKey;
		}

		// Check if there's a key file (for compatibility)
		const keyPath = `${this.getServerName()}.signing.key`;
		if (fs.existsSync(keyPath)) {
			this.cachedSigningKey = fs.readFileSync(keyPath, 'utf-8');
			// Save to settings for future use
			await this.saveSigningKey(this.cachedSigningKey);
			return this.cachedSigningKey;
		}

		// Generate new key
		this.cachedSigningKey = await this.generateSigningKey();
		await this.saveSigningKey(this.cachedSigningKey);
		return this.cachedSigningKey;
	}

	private async generateSigningKey(): Promise<string> {
		// Generate Ed25519 key pair
		const { privateKey } = crypto.generateKeyPairSync('ed25519', {
			privateKeyEncoding: {
				type: 'pkcs8',
				format: 'pem',
			},
		});

		// Convert to Matrix format (base64 encoded seed)
		// This is simplified - real implementation needs proper encoding
		const seed = crypto.randomBytes(32);
		return `ed25519 a_${this.getServerName()} ${seed.toString('base64')}`;
	}

	private async saveSigningKey(key: string): Promise<void> {
		// Save to Rocket.Chat settings
		settings.set('Federation_Matrix_Signing_Key', key);
	}

	/**
	 * Get configuration object for homeserver
	 */
	getConfig() {
		return {
			serverName: this.getServerName(),
			port: this.getPort(),
			signingKeyPath: '', // Not used since we provide key directly
		};
	}
}