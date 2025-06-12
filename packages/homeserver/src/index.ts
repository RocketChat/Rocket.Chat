// Export legacy client for backward compatibility
export * from './HomeserverClient';
export * from './types';

// Export new adapter system
export { RocketChatAdapter } from './adapters/rocket-chat-adapter';
export { HomeserverModuleLoader } from './module-loader';
export { RouteConverter } from './adapters/route-converter';

// Export federation SDK
export { FederationEndpoints } from './federation-sdk/specs/federation-api';
export type {
	MakeJoinResponse,
	SendJoinResponse,
	SendTransactionResponse,
	State,
	StateIds,
	Transaction,
	Version,
} from './federation-sdk/specs/federation-api';

export { FederationModule } from './federation-sdk/federation.module';
export type {
	FederationModuleAsyncOptions,
	FederationModuleOptions,
} from './federation-sdk/federation.module';

export { FederationConfigService } from './federation-sdk/services/federation-config.service';
export { FederationRequestService } from './federation-sdk/services/federation-request.service';
export { FederationService } from './federation-sdk/services/federation.service';
export { SignatureVerificationService } from './federation-sdk/services/signature-verification.service';

// Re-export types
export type {
	HomeserverConfig,
	HomeserverInternalConfig,
	RouteDefinition,
	RouteHandler,
} from './types';