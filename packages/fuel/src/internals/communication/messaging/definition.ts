import type { IInternalRPCServiceRegistrar } from '../rpc/strategies/definition';

export abstract class PublishableEvent<T extends object> {
	abstract name: string;

	abstract payload: T;

	abstract occurredOn: Date;
}

export type CancellableEvent = {
	cancel: () => Promise<void>
}

export interface IInternalEphemeralMessagingRegistrar {
	// TODO: extras is required because moleculer events needs to be registered in a specific service while others strategies just register events
	registerConsumer<TInput extends object>(
		topic: string,
		handler: (input: PublishableEvent<TInput>) => Promise<void>,
		extras: IInternalRPCServiceRegistrar,
	): Promise<CancellableEvent>;
}

export interface IInternalRPCClient {
	send<TInput, TOutput>(serviceName: string, action: string, input: TInput): Promise<TOutput>;
}

export interface IInternalEphemeralMessagingClient {
	emit<TInput extends object>(topic: string, input: PublishableEvent<TInput>): Promise<void>;
}
