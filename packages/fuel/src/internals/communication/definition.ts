import { FUEL_DI_TOKENS, inject } from "../dependency-injection";
import { ILogger } from "../observability";
import { IInternalEphemeralMessagingClient, IInternalEphemeralMessagingRegistrar, IInternalRPCClient } from "./messaging/definition";
import { IInternalRPCAdapter } from "./rpc/strategies/definition";

export interface IEnvelope<T> {
	payload: T;
}

export enum InterProcessCommunicationDriverTypes {
	MOLECULER = 'MOLECULER',
	NATS = 'NATS',
}

export type InterProcessCommunicationStartParams = {
	driver: InterProcessCommunicationDriverTypes;
	url: string;
};

export interface IInterProcessCommunicationDriver {
	connect(initialParameters: InterProcessCommunicationStartParams, logger: ILogger): Promise<void>;

	getConnection<T>(): T;
}

export abstract class RemoteExternalModuleProvider {

	constructor(
		@inject(FUEL_DI_TOKENS.INTERNAL_RPC_ADAPTER) protected rpcAdapter: IInternalRPCAdapter,
		@inject(FUEL_DI_TOKENS.INTERNAL_EPHEMERAL_MESSAGING_CLIENT) protected messagingClient: IInternalEphemeralMessagingClient,
	) {
	}

	public abstract registerActions(): Promise<void>;
	public abstract deleteServices(): Promise<void>;
}

export abstract class RemoteExternalModuleConsumer {

	constructor(
		@inject(FUEL_DI_TOKENS.INTERNAL_RPC_CLIENT) protected rpcClient: IInternalRPCClient,
		@inject(FUEL_DI_TOKENS.INTERNAL_EPHEMERAL_MESSAGING_REGISTRAR) protected messagingRegistrar: IInternalEphemeralMessagingRegistrar,
	) {

	}

	public abstract stopEventListeners(): Promise<void>;
}

export abstract class InMemoryExternalModuleProvider {

}

export abstract class InMemoryExternalModuleConsumer {

	constructor(protected inMemoryProvider: InMemoryExternalModuleProvider) {

	}
}