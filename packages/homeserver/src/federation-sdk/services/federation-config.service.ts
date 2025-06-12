import { inject, injectable } from 'tsyringe';
import type { FederationModuleOptions } from '../federation.module';

@injectable()
export class FederationConfigService {
	constructor(
		@inject('FEDERATION_OPTIONS')
		private readonly options: FederationModuleOptions,
	) {}

	get serverName(): string {
		return this.options.serverName;
	}

	get signingKey(): string {
		return this.options.signingKey;
	}

	get signingKeyId(): string {
		return this.options.signingKeyId || 'ed25519:1';
	}

	get timeout(): number {
		return this.options.timeout || 30000; // Default 30 seconds
	}

	get baseUrl(): string | undefined {
		return this.options.baseUrl;
	}
}
