import { EventEmitter } from 'eventemitter3';
import { Streamer } from './streamer';
import { STREAM_NAMES } from './constants';
import { Meteor } from 'meteor/meteor';
import { DDPCommon } from 'meteor/ddp-common';

const prepareSubscription = Symbol('prepareSubscription');
const prepareMethod = Symbol('prepareMethod');

const removeSubscription = Symbol('removeSubscription');
const authorizaton = Symbol('authorizaton');

const authz = (authorizations, eventName, fn) => {
	if (fn === undefined) {
		fn = eventName;
		eventName = '__all__';
	}

	if (typeof fn === 'function') {
		return authorizations[eventName] = fn;
	}

	if (typeof fn === 'string' && ['all', 'none', 'logged'].indexOf(fn) === -1) {
		console.error(`allowWrite shortcut '${ fn }' is invalid`);
	}

	if (fn === 'all' || fn === true) {
		return authorizations[eventName] = function() {
			return true;
		};
	}

	if (fn === 'none' || fn === false) {
		return authorizations[eventName] = function() {
			return false;
		};
	}

	if (fn === 'logged') {
		return authorizations[eventName] = function() {
			return Boolean(this.userId);
		};
	}
};

export class Stream extends EventEmitter {
	constructor(n) {
		super();
		if (Streamer[n]) {
			throw 'the stream already exists';
		}
		Streamer[n] = this;
		this.name = n;
		this.subscriptionName = `stream-${ STREAM_NAMES[this.name] }`;
		this.internals = new EventEmitter;

		this[prepareSubscription]();
		this[prepareMethod]();

		this[authorizaton] = {
			read: {},
			write: {},
		};


	}

	allowWrite(eventName, fn) {
		return authz(this[authorizaton].write, eventName, fn);
	}

	allowRead(eventName, fn) {
		return authz(this[authorizaton].read, eventName, fn);
	}


	isReadAllowed(scope, eventName, ...args) {
		if (this[authorizaton].read[eventName]) {
			return this[authorizaton].read[eventName].call(scope, eventName, ...args);
		}
		return this[authorizaton].read.__all__.call(scope, eventName, ...args);
	}

	isWriteAllowed(scope, eventName, ...args) {
		if (this[authorizaton].write[eventName]) {
			return this[authorizaton].write[eventName].call(scope, eventName, ...args);
		}
		return this[authorizaton].write.__all__.call(scope, eventName, ...args);
	}

	subscribe(publication, eventName, { args } = {}) {
		if (!this.isReadAllowed(publication, eventName, args)) {
			publication.stop();
			throw new Meteor.Error('not-allowed');
		}
		const cancel = this.addSubscription(eventName, publication._session.socket);
		publication.onStop(cancel);
		publication.ready();
	}

	changedPayload(fields, collection = this.subscriptionName) {
		return DDPCommon.stringifyDDP({
			msg: 'changed',
			collection,
			id: 'id',
			fields,
		});
	}


	emitDifferentEventName(key, eventName, ...args) {
		const msg = this.changedPayload({
			eventName,
			args,
		}, this.subscriptionName);

		Streamer.emit('emit', this.name, eventName, this.listenerCount(eventName), msg);
		return super.emit(key, msg);
	}

	emit(eventName, ...args) {
		const msg = this.changedPayload({
			eventName,
			args,
		}, this.subscriptionName);

		Streamer.emit('emit', this.name, eventName, this.listenerCount(eventName), msg);
		return super.emit(eventName, msg);
	}

	[prepareMethod]() {
		const stream = this;
		const method = {

			[this.subscriptionName](eventName, ...args) {
				// this.unblock();
				if (stream.isWriteAllowed(this, eventName, ...args) !== true) {
					return;
				}
				Streamer.broadcast(stream.name, eventName, ...args);
				// stream.emit(eventName, ...args);
			},
		};

		Meteor.methods(method);
	}

	[prepareSubscription]() {
		const self = this;
		Meteor.publish(this.subscriptionName, function(...args) { return self.subscribe.apply(self, [this, ...args]); });
	}

	addSubscription(eventName, client) {
		const fn = (msg) => client.send(msg);
		this.on(eventName, fn);
		return () => this[removeSubscription](eventName, fn);
	}

	[removeSubscription](eventName, fn) {
		return this.removeListener(eventName, fn);
	}
}
