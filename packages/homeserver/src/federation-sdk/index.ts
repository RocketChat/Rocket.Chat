export { FederationEndpoints } from './specs/federation-api';
export type {
	MakeJoinResponse,
	SendJoinResponse,
	SendTransactionResponse,
	State,
	StateIds,
	Transaction,
	Version,
} from './specs/federation-api';

export { FederationModule } from './federation.module';
export type {
	FederationModuleAsyncOptions,
	FederationModuleOptions,
} from './federation.module';

export { FederationConfigService } from './services/federation-config.service';
export { FederationRequestService } from './services/federation-request.service';
export { FederationService } from './services/federation.service';
export { SignatureVerificationService } from './services/signature-verification.service';
