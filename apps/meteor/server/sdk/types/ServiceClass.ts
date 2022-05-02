import { EventEmitter } from 'events';

import { asyncLocalStorage } from '..';
import { IBroker, IBrokerNode } from './IBroker';
import { EventSignatures } from '../lib/Events';

export interface IServiceContext {
	id: string; // Context ID
	broker: IBroker; // Instance of the broker.
	nodeID: string | null; // The caller or target Node ID.
	// action: Object; // Instance of action definition.
	// event: Object; // Instance of event definition.
	// eventName: Object; // The emitted event name.
	// eventType: String; // Type of event (“emit” or “broadcast”).
	// eventGroups: Array; // String>	Groups of event.
	// caller: String; // Service full name of the caller. E.g.: v3.myService
	requestID: string | null; // Request ID. If you make nested-calls, it will be the same ID.
	// parentID: String; // Parent context ID (in nested-calls).
	// params: Any; // Request params. Second argument from broker.call.
	// meta: Any; // Request metadata. It will be also transferred to nested-calls.
	// locals: any; // Local data.
	// level: Number; // Request level (in nested-calls). The first level is 1.
	// span: Span; // Current active span.
	ctx?: any;
}

export interface IServiceClass {
	getName(): string;
	onNodeConnected?({ node, reconnected }: { node: IBrokerNode; reconnected: boolean }): void;
	onNodeUpdated?({ node }: { node: IBrokerNode }): void;
	onNodeDisconnected?({ node, unexpected }: { node: IBrokerNode; unexpected: boolean }): Promise<void>;

	onEvent<T extends keyof EventSignatures>(event: T, handler: EventSignatures[T]): void;

	created?(): Promise<void>;
	started?(): Promise<void>;
	stopped?(): Promise<void>;
}

export abstract class ServiceClass implements IServiceClass {
	protected name: string;

	protected events = new EventEmitter();

	protected internal = false;

	constructor() {
		this.emit = this.emit.bind(this);
	}

	getEvents(): Array<keyof EventSignatures> {
		return this.events.eventNames() as unknown as Array<keyof EventSignatures>;
	}

	getName(): string {
		return this.name;
	}

	isInternal(): boolean {
		return this.internal;
	}

	get context(): IServiceContext | undefined {
		return asyncLocalStorage.getStore();
	}

	public onEvent<T extends keyof EventSignatures>(event: T, handler: EventSignatures[T]): void {
		this.events.on(event, handler);
	}

	public emit<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): void {
		this.events.emit(event, ...args);
	}
}

/**
 * An internal service is a service that is registered only on monolith node.
 * Services that run on their own node should use @ServiceClass instead.
 */
export abstract class ServiceClassInternal extends ServiceClass {
	protected internal = true;
}
