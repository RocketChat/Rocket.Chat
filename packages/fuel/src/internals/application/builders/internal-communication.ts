import type {
	IInterProcessCommunicationDriver,
	InterProcessCommunicationStartParams,
	IInternalEphemeralMessagingClient,
	IInternalEphemeralMessagingRegistrar,
	IInternalRPCClient,
	IInternalRPCAdapter,
} from '../../communication';
import {
	InterProcessCommunicationDriverTypes,
	MoleculerDriver,
	NatsDriver,
	InMemoryEphemeralMessagingClient,
	InMemoryEphemeralMessagingRegistrar,
	MoleculerEphemeralMessagingClient,
	MoleculerEphemeralMessagingRegistrar,
	NatsEphemeralMessagingClient,
	NatsEphemeralMessagingRegistrar,
	InMemoryRPCAdapter,
	InMemoryRPCClient,
	MoleculerRPCAdapter,
	MoleculerRPCClient,
	NatsRPCAdapter,
	NatsRPCClient,
} from '../../communication';
import { FUEL_DI_TOKENS } from '../../dependency-injection';
import type { DependencyContainerManager } from '../../dependency-injection';
import type { ILogger, IMetrics, ITracing } from '../../observability';

const internalCommunicationDriversMap = {
	[InterProcessCommunicationDriverTypes.NATS]: {
		rpc: {
			registrar: NatsRPCAdapter,
			client: NatsRPCClient,
		},
		messaging: {
			registrar: NatsEphemeralMessagingRegistrar,
			client: NatsEphemeralMessagingClient,
		},
	},
	[InterProcessCommunicationDriverTypes.MOLECULER]: {
		rpc: {
			registrar: MoleculerRPCAdapter,
			client: MoleculerRPCClient,
		},
		messaging: {
			registrar: MoleculerEphemeralMessagingRegistrar,
			client: MoleculerEphemeralMessagingClient,
		},
	},
};

export class InternalCommunicationBuilder {
	private instance: IInterProcessCommunicationDriver;

	constructor(private config: InterProcessCommunicationStartParams) {
		this.instance = this.config.driver === InterProcessCommunicationDriverTypes.MOLECULER ? new MoleculerDriver() : new NatsDriver();
	}

	public static registerLocalDependenciesOnly(dependencyContainer: DependencyContainerManager): void {
		dependencyContainer.registerSingleton<IInternalRPCClient>(FUEL_DI_TOKENS.INTERNAL_RPC_CLIENT, InMemoryRPCClient);
		dependencyContainer.registerSingleton<IInternalRPCAdapter>(FUEL_DI_TOKENS.INTERNAL_RPC_ADAPTER, InMemoryRPCAdapter);
		dependencyContainer.registerSingleton<IInternalEphemeralMessagingClient>(
			FUEL_DI_TOKENS.INTERNAL_EPHEMERAL_MESSAGING_CLIENT,
			InMemoryEphemeralMessagingClient,
		);
		dependencyContainer.registerSingleton<IInternalEphemeralMessagingRegistrar>(
			FUEL_DI_TOKENS.INTERNAL_EPHEMERAL_MESSAGING_REGISTRAR,
			InMemoryEphemeralMessagingRegistrar,
		);
	}

	public async start(dependencyContainer: DependencyContainerManager): Promise<void> {
		const logger = dependencyContainer.resolveByToken<ILogger>(FUEL_DI_TOKENS.LOGGER);
		const tracing = dependencyContainer.resolveByToken<ITracing>(FUEL_DI_TOKENS.TRACING);
		const metrics = dependencyContainer.resolveByToken<IMetrics>(FUEL_DI_TOKENS.METRICS);
		await this.instance.connect(this.config, logger);
		const connection: any = await this.instance.getConnection(); // TODO: type this properly

		const { driver } = this.config;
		dependencyContainer.registerValueAsFunction<IInternalRPCClient>(
			FUEL_DI_TOKENS.INTERNAL_RPC_CLIENT,
			// eslint-disable-next-line new-cap
			() => new internalCommunicationDriversMap[driver].rpc.client(connection, tracing, metrics, logger),
		);
		dependencyContainer.registerValueAsFunction<IInternalRPCAdapter>(
			FUEL_DI_TOKENS.INTERNAL_RPC_ADAPTER,
			// eslint-disable-next-line new-cap
			() => new internalCommunicationDriversMap[driver].rpc.registrar(connection, tracing, metrics, logger),
		);
		dependencyContainer.registerValueAsFunction<IInternalEphemeralMessagingClient>(
			FUEL_DI_TOKENS.INTERNAL_EPHEMERAL_MESSAGING_CLIENT,
			// eslint-disable-next-line new-cap
			() => new internalCommunicationDriversMap[driver].messaging.client(connection, tracing, logger),
		);
		dependencyContainer.registerValueAsFunction<IInternalEphemeralMessagingRegistrar>(
			FUEL_DI_TOKENS.INTERNAL_EPHEMERAL_MESSAGING_REGISTRAR,
			// eslint-disable-next-line new-cap
			() => new internalCommunicationDriversMap[driver].messaging.registrar(connection, tracing, metrics, logger),
		);
	}
}
