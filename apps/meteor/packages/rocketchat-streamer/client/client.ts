import { Meteor } from 'meteor/meteor';
import { DDPCommon } from 'meteor/ddp-common';
import { Tracker } from 'meteor/tracker';
import { check, Match } from 'meteor/check';

import { EV, type EventHandler, type StreamArgs } from '../lib/ev';

const NonEmptyString = Match.Where((value: unknown) => {
	check(value, String);
	return (value as string).length > 0;
});

interface StreamerSubscriptionState {
	subscription?: Meteor.SubscriptionHandle;
	lastMessage?: StreamArgs;
}

type SubscriptionMap = Record<string, StreamerSubscriptionState | undefined>;

interface StreamerOptions {
	useCollection?: boolean;
	ddpConnection?: StreamerDDPConnection;
}

interface StreamerDDPConnection extends Meteor.IMeteorConnection {
	_stream: Meteor.IMeteorConnection['_stream'];
	subscribe(name: string, ...args: unknown[]): Meteor.SubscriptionHandle;
	call(methodName: string, ...args: unknown[]): void;
}

const isStreamerPayload = (
	message: unknown,
): message is {
	collection: string;
	fields: { eventName: string; args: StreamArgs };
} => {
	if (!message || typeof message !== 'object') {
		return false;
	}
	const payload = message as Record<string, unknown>;
	if (payload.msg !== 'changed' || typeof payload.collection !== 'string') {
		return false;
	}
	const fields = payload.fields as Record<string, unknown> | undefined;
	if (!fields) {
		return false;
	}
	return typeof fields.eventName === 'string' && Array.isArray(fields.args);
};

class StreamerCentral extends EV {
	public instances: Record<string, Streamer> = {};
	private readonly ddpConnections: Record<string, StreamerDDPConnection> = {};

	setupDdpConnection(name: string, ddpConnection: StreamerDDPConnection): void {
		if (ddpConnection.hasMeteorStreamerEventListeners) {
			return;
		}

		ddpConnection._stream.on('message', (rawMessage?: unknown) => {
			if (typeof rawMessage !== 'string') {
				return;
			}
			const parsedMessage = DDPCommon.parseDDP(rawMessage);
			if (isStreamerPayload(parsedMessage)) {
				this.emit(parsedMessage.collection, parsedMessage.fields.eventName, ...parsedMessage.fields.args);
			}
		});

		this.storeDdpConnection(name, ddpConnection);
	}

	private storeDdpConnection(name: string, ddpConnection: StreamerDDPConnection): void {
		ddpConnection.hasMeteorStreamerEventListeners = true;
		this.ddpConnections[name] = ddpConnection;
	}
}

const streamerCentral = new StreamerCentral();
Meteor.StreamerCentral = streamerCentral;

type StreamerCallback = (...args: StreamArgs) => void;

export class Streamer extends EV {
	private ddpConnection: StreamerDDPConnection;
	private _name = '';
	private _useCollection = false;
	private readonly subscriptions: SubscriptionMap = {};

	constructor(name: string, options: StreamerOptions = {}) {
		super();

		const { useCollection = false, ddpConnection = Meteor.connection as StreamerDDPConnection } = options;

		this.ddpConnection = ddpConnection;
		streamerCentral.setupDdpConnection(name, ddpConnection);

		streamerCentral.instances[name] = this;

		this.name = name;
		this.useCollection = useCollection;

		streamerCentral.on(this.subscriptionName, (eventName: string, ...args: StreamArgs) => {
			const subscription = this.subscriptions[eventName];
			if (subscription) {
				subscription.lastMessage = args;
				this.emitLocal(eventName, ...args);
			}
		});

		this.ddpConnection._stream.on('reset', () => {
			this.emitLocal('__reconnect__');
		});

		const existingInstance = streamerCentral.instances[name];
		if (existingInstance) {
			console.warn('Streamer instance already exists:', name);
			return existingInstance;
		}
	}

	get name(): string {
		return this._name;
	}

	set name(name: string) {
		check(name, String);
		this._name = name;
	}

	get subscriptionName(): string {
		return `stream-${this.name}`;
	}

	get useCollection(): boolean {
		return this._useCollection;
	}

	set useCollection(useCollection: boolean) {
		check(useCollection, Boolean);
		this._useCollection = useCollection;
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

			const subscription = Tracker.nonreactive(() =>
				this.ddpConnection.subscribe(
					this.subscriptionName,
					eventName,
					{ useCollection: this.useCollection, args },
					{
						onStop: () => {
							this.unsubscribe(eventName);
							reject(new Meteor.Error('streamer-subscription-stopped'));
						},
						onReady: resolve,
					},
				),
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

	override on(eventName: string, callback: EventHandler, ...args: unknown[]): Promise<void> {
		check(eventName, NonEmptyString);

		check(callback, Function);

		super.on(eventName, callback);

		return this.subscribe(eventName, args);
	}

	override once(eventName: string, callback: EventHandler, ...args: unknown[]): Promise<void> {
		check(eventName, NonEmptyString);

		check(callback, Function);

		super.once(eventName, (...cbArgs: StreamArgs) => {
			(callback as StreamerCallback)(...cbArgs);
			if (this.listenerCount(eventName) === 0) {
				this.stop(eventName);
			}
		});

		return this.subscribe(eventName, args);
	}

	override emit(...args: StreamArgs): void {
		this.ddpConnection.call(this.subscriptionName, ...args);
	}

	private emitLocal(eventName: string, ...args: StreamArgs): void {
		super.emit(eventName, ...args);
	}
}

Object.assign(Meteor, { Streamer });
