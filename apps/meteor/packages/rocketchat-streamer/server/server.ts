import { Meteor, type Subscription } from 'meteor/meteor';
import { DDPCommon } from 'meteor/ddp-common';
import { check, Match } from 'meteor/check';

import { EV } from '../lib/ev';

type StreamArgs = unknown[];
type PermissionShortcut = 'all' | 'none' | 'logged';
type PermissionPredicate = (this: PermissionScope, eventName: string, ...args: StreamArgs) => boolean;
type PermissionSetting = PermissionPredicate | PermissionShortcut | boolean | undefined;

interface PermissionScope {
	userId?: string | null;
	connection: Meteor.Connection;
}

interface StreamerOptions {
	retransmit?: boolean;
	retransmitToSelf?: boolean;
}

interface StreamSession {
	socket?: {
		send(message: string): void;
	};
	sendAdded(collection: string, id: string, fields: Record<string, unknown>): void;
}

interface SubscriptionWrapper {
	subscription: Subscription;
	eventName: string;
}

type SubscriptionDictionary = Record<string, SubscriptionWrapper[] | undefined>;

interface PublishOptionsObject {
	useCollection?: boolean;
	args?: StreamArgs;
}

type PublishOptions = boolean | PublishOptionsObject | undefined;

interface MethodScope {
	userId?: string | null;
	connection: Meteor.Connection | null;
	originalParams: StreamArgs;
	tranformed: boolean;
}

type TransformerMap = Record<string, Array<(...args: any[]) => any> | undefined>;

const isEmpty = (obj: Record<string, unknown>) => !Object.entries(obj || {}).length;

const changedPayload = (collection: string, id: string, fields: Record<string, unknown>) => {
	if (isEmpty(fields)) {
		return undefined;
	}
	return DDPCommon.stringifyDDP({
		msg: 'changed',
		collection,
		id,
		fields,
	});
};

const send = (session: StreamSession, msg: string): void => {
	if (!session.socket) {
		return;
	}
	session.socket.send(msg);
};

class StreamerCentral extends EV {
	public instances: Record<string, Streamer> = {};
}

const streamerCentral = new StreamerCentral();

type StreamerConstructor = typeof Streamer;

declare module 'meteor/meteor' {
	namespace Meteor {
		var StreamerCentral: EV;
		var Streamer: StreamerConstructor;
	}

	interface Subscription {
		connection: Meteor.Connection;
		_session: StreamSession;
		onStop(callback: () => void): void;
		ready(): void;
		stop(): void;
	}
}

Meteor.StreamerCentral = streamerCentral;

export class Streamer extends EV {
	private _name = '';
	private _retransmit = true;
	private _retransmitToSelf = false;
	private readonly subscriptions: SubscriptionWrapper[] = [];
	private readonly subscriptionsByEventName: SubscriptionDictionary = {};
	private readonly transformers: TransformerMap = {};
	private readonly _allowRead: Record<string, PermissionPredicate> = {};
	private readonly _allowEmit: Record<string, PermissionPredicate> = {};
	private readonly _allowWrite: Record<string, PermissionPredicate> = {};

	constructor(name: string, { retransmit = true, retransmitToSelf = false }: StreamerOptions = {}) {
		super();

		const existingInstance = streamerCentral.instances[name];
		if (existingInstance) {
			console.warn('Streamer instance already exists:', name);
			return existingInstance;
		}

		streamerCentral.instances[name] = this;

		this.name = name;
		this.retransmit = retransmit;
		this.retransmitToSelf = retransmitToSelf;

		this.iniPublication();
		this.initMethod();

		this.allowRead('none');
		this.allowEmit('all');
		this.allowWrite('none');
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

	get retransmit(): boolean {
		return this._retransmit;
	}

	set retransmit(retransmit: boolean) {
		check(retransmit, Boolean);
		this._retransmit = retransmit;
	}

	get retransmitToSelf(): boolean {
		return this._retransmitToSelf;
	}

	set retransmitToSelf(retransmitToSelf: boolean) {
		check(retransmitToSelf, Boolean);
		this._retransmitToSelf = retransmitToSelf;
	}

	allowRead(eventName: string | PermissionSetting, fn?: PermissionSetting): PermissionPredicate | undefined {
		return this.setPermission(this._allowRead, eventName, fn, 'allowRead');
	}

	allowEmit(eventName: string | PermissionSetting, fn?: PermissionSetting): PermissionPredicate | undefined {
		return this.setPermission(this._allowEmit, eventName, fn, 'allowRead');
	}

	allowWrite(eventName: string | PermissionSetting, fn?: PermissionSetting): PermissionPredicate | undefined {
		return this.setPermission(this._allowWrite, eventName, fn, 'allowWrite');
	}

	isReadAllowed(scope: PermissionScope, eventName: string, args: StreamArgs): boolean {
		return this.resolvePermission(this._allowRead, scope, eventName, args);
	}

	isEmitAllowed(scope: PermissionScope, eventName: string, ...args: StreamArgs): boolean {
		return this.resolvePermission(this._allowEmit, scope, eventName, args);
	}

	isWriteAllowed(scope: PermissionScope, eventName: string, args: StreamArgs): boolean {
		return this.resolvePermission(this._allowWrite, scope, eventName, args);
	}

	addSubscription(subscription: SubscriptionWrapper, eventName: string): void {
		this.subscriptions.push(subscription);
		if (!this.subscriptionsByEventName[eventName]) {
			this.subscriptionsByEventName[eventName] = [];
		}
		this.subscriptionsByEventName[eventName]!.push(subscription);
	}

	removeSubscription(subscription: SubscriptionWrapper, eventName: string): void {
		const globalIndex = this.subscriptions.indexOf(subscription);
		if (globalIndex > -1) {
			this.subscriptions.splice(globalIndex, 1);
		}

		const eventSubscriptions = this.subscriptionsByEventName[eventName];
		if (eventSubscriptions) {
			const eventIndex = eventSubscriptions.indexOf(subscription);
			if (eventIndex > -1) {
				eventSubscriptions.splice(eventIndex, 1);
			}
		}
	}

	transform(eventName: string | ((...args: any[]) => any), fn?: (...args: any[]) => any): void {
		let targetEvent = eventName;
		let handler = fn;
		if (typeof eventName === 'function') {
			handler = eventName;
			targetEvent = '__all__';
		}

		if (typeof handler !== 'function' || typeof targetEvent !== 'string') {
			return;
		}

		if (!this.transformers[targetEvent]) {
			this.transformers[targetEvent] = [];
		}
		this.transformers[targetEvent]!.push(handler);
	}

	applyTransformers(methodScope: MethodScope, eventName: string, args: StreamArgs): StreamArgs {
		let transformedArgs: any = args;
		const toArray = (value: any): StreamArgs => (Array.isArray(value) ? value : [value]);

		const globalTransformers = this.transformers['__all__'];
		if (globalTransformers) {
			globalTransformers.forEach((transform) => {
				transformedArgs = transform.call(methodScope, eventName, transformedArgs);
				methodScope.tranformed = true;
				transformedArgs = toArray(transformedArgs);
			});
		}

		const eventTransformers = this.transformers[eventName];
		if (eventTransformers) {
			eventTransformers.forEach((transform) => {
				transformedArgs = transform.call(methodScope, ...transformedArgs);
				methodScope.tranformed = true;
				transformedArgs = toArray(transformedArgs);
			});
		}

		return transformedArgs as StreamArgs;
	}

	_publish(publication: Subscription, eventName: string, options: PublishOptions = false): void {
		check(eventName, String);
		check(
			options,
			Match.OneOf(Boolean, {
				useCollection: Boolean,
				args: Array,
			}),
		);

		let useCollection = false;
		let args: StreamArgs = [];

		if (typeof options === 'boolean') {
			useCollection = options;
		} else if (options) {
			if (options.useCollection) {
				useCollection = options.useCollection;
			}
			if (options.args) {
				args = options.args;
			}
		}

		if (eventName.length === 0) {
			publication.stop();
			throw new Meteor.Error('invalid-event-name');
		}

		if (this.isReadAllowed(publication as PermissionScope, eventName, args) !== true) {
			publication.stop();
			throw new Meteor.Error('not-allowed');
		}

		const subscription: SubscriptionWrapper = {
			subscription: publication,
			eventName,
		};

		this.addSubscription(subscription, eventName);

		publication.onStop(() => {
			this.removeSubscription(subscription, eventName);
		});

		if (useCollection === true) {
			publication._session.sendAdded(this.subscriptionName, 'id', {
				eventName,
			});
		}

		publication.ready();
	}

	iniPublication(): void {
		const stream = this;
		Meteor.publish(this.subscriptionName, function (this: Subscription, eventName: string, options: PublishOptions) {
			return stream._publish(this, eventName, options);
		});
	}

	initMethod(): void {
		const stream = this;
		const method: Record<string, (this: Meteor.MethodThisType, eventName: string, ...args: StreamArgs) => void> = {};

		method[this.subscriptionName] = function (this: Meteor.MethodThisType, eventName: string, ...args: StreamArgs) {
			check(eventName, String);
			check(args, Array);

			this.unblock();

			if (stream.isWriteAllowed(this as PermissionScope, eventName, args) !== true) {
				return;
			}

			const methodScope: MethodScope = {
				userId: this.userId,
				connection: this.connection,
				originalParams: args,
				tranformed: false,
			};

			const transformedArgs = stream.applyTransformers(methodScope, eventName, args);

			stream.emitWithScope(eventName, methodScope, ...transformedArgs);

			if (stream.retransmit === true) {
				stream._emit(eventName, transformedArgs, this.connection, true);
			}
		};

		try {
			Meteor.methods(method);
		} catch (error) {
			console.error(error);
		}
	}

	_emit(eventName: string, args: StreamArgs, origin?: Meteor.Connection | null, broadcast?: boolean): void {
		if (broadcast === true) {
			streamerCentral.emit('broadcast', this.name, eventName, args);
		}

		const subscriptions = this.subscriptionsByEventName[eventName];
		if (!Array.isArray(subscriptions)) {
			return;
		}

		const msg = changedPayload(this.subscriptionName, 'id', {
			eventName,
			args,
		});

		if (!msg) {
			return;
		}

		subscriptions.forEach((subscription) => {
			if (this.retransmitToSelf === false && origin && origin === subscription.subscription.connection) {
				return;
			}

			if (this.isEmitAllowed(subscription.subscription as PermissionScope, eventName, ...args)) {
				send(subscription.subscription._session, msg);
			}
		});
	}

	override emit(eventName: string, ...args: StreamArgs): void {
		this._emit(eventName, args, undefined, true);
	}

	__emit(eventName: string, ...args: StreamArgs): void {
		super.emit(eventName, ...args);
	}

	emitWithoutBroadcast(eventName: string, ...args: StreamArgs): void {
		this._emit(eventName, args, undefined, false);
	}

	private resolvePermission(
		map: Record<string, PermissionPredicate>,
		scope: PermissionScope,
		eventName: string,
		args: StreamArgs,
	): boolean {
		if (map[eventName]) {
			return map[eventName]!.call(scope, eventName, ...args);
		}
		return map['__all__']?.call(scope, eventName, ...args) ?? false;
	}

	private setPermission(
		map: Record<string, PermissionPredicate>,
		eventName: string | PermissionSetting,
		fn?: PermissionSetting,
		errorLabel?: string,
	): PermissionPredicate | undefined {
		let targetEvent = eventName;
		let handler = fn;

		if (typeof fn === 'undefined') {
			handler = eventName as PermissionSetting;
			targetEvent = '__all__';
		}

		if (typeof targetEvent !== 'string') {
			return undefined;
		}

		if (typeof handler === 'function') {
			map[targetEvent] = handler as PermissionPredicate;
			return handler as PermissionPredicate;
		}

		if (typeof handler === 'string' && ['all', 'none', 'logged'].indexOf(handler) === -1) {
			console.error(`${errorLabel || 'allow'} shortcut '${handler}' is invalid`);
			return undefined;
		}

		if (handler === 'all' || handler === true) {
			map[targetEvent] = function () {
				return true;
			};
			return map[targetEvent];
		}

		if (handler === 'none' || handler === false) {
			map[targetEvent] = function () {
				return false;
			};
			return map[targetEvent];
		}

		if (handler === 'logged') {
			map[targetEvent] = function () {
				return Boolean(this.userId);
			};
			return map[targetEvent];
		}

		return undefined;
	}
}

Meteor.Streamer = Streamer;
