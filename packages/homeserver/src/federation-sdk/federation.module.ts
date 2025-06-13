import { FederationConfigService } from './services/federation-config.service';
import { FederationRequestService } from './services/federation-request.service';
import { FederationService } from './services/federation.service';
import { SignatureVerificationService } from './services/signature-verification.service';

export type FederationModuleOptions = {
	serverName: string;
	signingKey: string; // base64 encoded private key
	signingKeyId?: string;
	timeout?: number;
	baseUrl?: string;
};

export type FederationModuleAsyncOptions = {
	useFactory: (
		...args: any[]
	) => Promise<FederationModuleOptions> | FederationModuleOptions;
	inject?: any[];
	imports?: any[];
};

export class FederationModule {
	static forRootAsync(options: FederationModuleAsyncOptions) {
		return {
			module: FederationModule,
			imports: options.imports || [],
			providers: [
				{
					provide: 'FEDERATION_OPTIONS',
					useFactory: options.useFactory,
					inject: options.inject || [],
				},
				FederationConfigService,
				FederationService,
				SignatureVerificationService,
				FederationRequestService,
			],
			exports: [
				FederationService,
				SignatureVerificationService,
				FederationRequestService,
				FederationConfigService,
			],
		};
	}
}
