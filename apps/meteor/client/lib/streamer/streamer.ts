/* eslint-disable @typescript-eslint/naming-convention */
import type { StreamerEvents } from '@rocket.chat/ddp-client';

import { parseDDPMessage } from './ddp';
import { EV, type EventHandler, type StreamArgs } from './emitter';

interface SubscriptionHandle {
	stop: () => void;
}

interface StreamerSubscriptionState {
	subscription?: SubscriptionHandle;
	lastMessage?: StreamArgs;
}

type SubscriptionMap = Record<string, StreamerSubscriptionState | undefined>;

interface StreamerOptions {
	useCollection?: boolean;
	ddpConnection: StreamerDDPConnection;
}

interface StreamerDDPConnection {
	_stream: {
		on: {
			(key: 'message', callback: (data: string) => void): void;
			(key: 'reset', callback: () => void): void;
		};
	};
	subscribe(name: string, ...args: unknown[]): SubscriptionHandle;
	call(methodName: string, ...args: unknown[]): void;
	hasMeteorStreamerEventListeners?: boolean;
}

type EventNames = Extract<keyof StreamerEvents, string>;

export class StreamerCentral extends EV {
	public instances: {
		[N in EventNames]?: Streamer<N>;
	} = {};

	private readonly ddpConnections: Record<string, StreamerDDPConnection> = {};

	setupDdpConnection(name: string, ddpConnection: StreamerDDPConnection): void {
		if (ddpConnection.hasMeteorStreamerEventListeners) {
			return;
		}

		ddpConnection._stream.on('message', (rawMessage?: unknown) => {
			if (typeof rawMessage !== 'string') {
				return;
			}
			const parsedMessage = parseDDPMessage(rawMessage);

			if (
				'collection' in parsedMessage &&
				'fields' in parsedMessage &&
				parsedMessage.fields &&
				'eventName' in parsedMessage.fields &&
				'args' in parsedMessage.fields &&
				Array.isArray(parsedMessage.fields.args)
			) {
				this.emit(parsedMessage.collection, parsedMessage.fields.eventName, ...parsedMessage.fields.args);
			}
		});

		this.storeDdpConnection(name, ddpConnection);
	}

	private storeDdpConnection(name: string, ddpConnection: StreamerDDPConnection): void {
		ddpConnection.hasMeteorStreamerEventListeners = true;
		this.ddpConnections[name] = ddpConnection;
	}

	getStreamer<N extends EventNames>(name: N, options: StreamerOptions): Streamer<N> {
		const existingInstance = this.instances[name];
		if (existingInstance) {
			return existingInstance as Streamer<N>;
		}

		const streamer = new Streamer(name, options);
		this.setupDdpConnection(name, options.ddpConnection);
		this.instances[name] = streamer as any;
		this.on(streamer.subscriptionName, (eventName: string, ...args: StreamArgs) => {
			streamer.receive(eventName, ...args);
		});
		return streamer;
	}
}

type StreamerCallback = (...args: StreamArgs) => void;

export class Streamer<N extends EventNames> extends EV {
	private ddpConnection: StreamerDDPConnection;

	public name: N;

	public useCollection = false;

	private readonly subscriptions: SubscriptionMap = {};

	constructor(name: N, { ddpConnection, useCollection = false }: StreamerOptions) {
		super();

		this.ddpConnection = ddpConnection;

		this.name = name;
		this.useCollection = useCollection;

		this.ddpConnection._stream.on('reset', () => {
			super.emit('__reconnect__');
		});
	}

	get subscriptionName(): `stream-${N}` {
		return `stream-${this.name}`;
	}

	stop(eventName: string): void {
		this.subscriptions[eventName]?.subscription?.stop();
	}

	stopAll(): void {
		Object.keys(this.subscriptions).forEach((eventName) => this.removeAllListeners(eventName));
	}

	unsubscribe(eventName: string): void {
		delete this.subscriptions[eventName];
		super.removeAllListeners(eventName);
	}

	subscribe(eventName: string, args: StreamArgs = []): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.subscriptions[eventName]) {
				resolve();
				return;
			}

			const subscription = this.ddpConnection.subscribe(
				this.subscriptionName,
				eventName,
				{ useCollection: this.useCollection, args },
				{
					onStop: () => {
						this.unsubscribe(eventName);
						reject(new Error('streamer-subscription-stopped'));
					},
					onReady: resolve,
				},
			);

			this.subscriptions[eventName] = { subscription };
		});
	}

	onReconnect(callback: StreamerCallback): void {
		if (typeof callback === 'function') {
			super.on('__reconnect__', callback);
		}
	}

	getLastMessageFromEvent(eventName: string): StreamArgs | undefined {
		return this.subscriptions[eventName]?.lastMessage;
	}

	override removeAllListeners(eventName: string): void {
		super.removeAllListeners(eventName);
		this.stop(eventName);
	}

	override removeListener(eventName: string, callback: EventHandler): void {
		if (this.listenerCount(eventName) === 1) {
			this.stop(eventName);
		}
		super.removeListener(eventName, callback);
	}

	override on(eventName: string, callback: EventHandler, ...args: StreamArgs): Promise<void> {
		// check eventName is a non-empty string
		if (typeof eventName !== 'string' || eventName.length === 0) {
			throw new Error('Event name must be a non-empty string');
		}

		// check callback is a function
		if (typeof callback !== 'function') {
			throw new Error('Callback must be a function');
		}

		super.on(eventName, callback);

		return this.subscribe(eventName, args);
	}

	override once(eventName: string, callback: EventHandler, ...args: StreamArgs): Promise<void> {
		// check eventName is a non-empty string
		if (typeof eventName !== 'string' || eventName.length === 0) {
			throw new Error('Event name must be a non-empty string');
		}

		// check callback is a function
		if (typeof callback !== 'function') {
			throw new Error('Callback must be a function');
		}

		super.once(eventName, (...cbArgs: StreamArgs) => {
			callback(...cbArgs);
			if (this.listenerCount(eventName) === 0) {
				this.stop(eventName);
			}
		});

		return this.subscribe(eventName, args);
	}

	override emit(...args: StreamArgs): void {
		this.ddpConnection.call(this.subscriptionName, ...args);
	}

	public receive(eventName: string, ...args: StreamArgs): void {
		const subscription = this.subscriptions[eventName];
		if (subscription) {
			subscription.lastMessage = args;
			super.emit(eventName, ...args);
		}
	}
}
