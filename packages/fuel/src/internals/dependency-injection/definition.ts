export { inject, injectable, Container, unmanaged } from 'inversify';
export type { interfaces } from 'inversify';

export enum INJECTION_SCOPE {
	TRANSIENT = 'TRANSIENT',
	SINGLETON = 'SINGLETON',
	VALUE = 'VALUE',
}

export enum FUEL_DI_TOKENS {
	LOGGER = 'Logger',
	METRICS = 'Metrics',
	TRACING = 'Tracing',
	EXTERNAL_HTTP_ROUTER = 'ExternalHttpRouter',
	DEPENDENCY_CONTAINER_READER = 'DependencyContainerReader',
	DOMAIN_EVENT_PUBLISHER = 'DomainEventPublisher',
	LICENSE_MANAGER = 'LicenseManager',
	DB_CONNECTION_READER_FACTORY = 'DBConnectionReaderFactory',
	INTERNAL_RPC_CLIENT = 'InternalRPCClient',
	INTERNAL_RPC_ADAPTER = 'InternalRPCAdapter',
	INTERNAL_EPHEMERAL_MESSAGING_CLIENT = 'InternalEphemeralMessagingClient',
	INTERNAL_EPHEMERAL_MESSAGING_REGISTRAR = 'InternalEphemeralMessagingRegistrar',
	CONFIG_SERVICE = 'ConfigService',
	CONFIG_OPTIONS = 'ConfigOptions',
}
