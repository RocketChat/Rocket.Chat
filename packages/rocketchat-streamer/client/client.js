/* globals DDPCommon, EV */
/* eslint-disable new-cap */
const NonEmptyString = Match.Where(function (x) {
	check(x, String);
	return x.length > 0;
});

class StreamerCentral extends EV {
	constructor() {
		super();

		this.instances = {};
		this.ddpConnections = {};		// since each Streamer instance can provide its own ddp connection, store them by streamer name
	}

	setupDdpConnection(name, ddpConnection) {
		// make sure we only setup event listeners for each ddp connection once
		if (ddpConnection.hasMeteorStreamerEventListeners) {
			return;
		}
		ddpConnection._stream.on('message', (raw_msg) => {
			const msg = DDPCommon.parseDDP(raw_msg);
			if (msg && msg.msg === 'changed' && msg.collection && msg.fields && msg.fields.eventName && msg.fields.args) {
				msg.fields.args.unshift(msg.fields.eventName);
				msg.fields.args.unshift(msg.collection);
				this.emit.apply(this, msg.fields.args);
			}
		});
		// store ddp connection
		this.storeDdpConnection(name, ddpConnection);

	}

	storeDdpConnection(name, ddpConnection) {
		// mark the connection as setup for Streamer, and store it
		ddpConnection.hasMeteorStreamerEventListeners = true;
		this.ddpConnections[name] = ddpConnection;
	}
}

Meteor.StreamerCentral = new StreamerCentral;

Meteor.Streamer = class Streamer extends EV {
	constructor(name, { useCollection = false, ddpConnection = Meteor.connection } = {}) {
		if (Meteor.StreamerCentral.instances[name]) {
			console.warn('Streamer instance already exists:', name);
			return Meteor.StreamerCentral.instances[name];
		}
		Meteor.StreamerCentral.setupDdpConnection(name, ddpConnection);

		super();

		this.ddpConnection = ddpConnection || Meteor.connection;

		Meteor.StreamerCentral.instances[name] = this;

		this.name = name;
		this.useCollection = useCollection;
		this.subscriptions = {};

		Meteor.StreamerCentral.on(this.subscriptionName, (eventName, ...args) => {
			if (this.subscriptions[eventName]) {
				this.subscriptions[eventName].lastMessage = args;
				super.emit.call(this, eventName, ...args);
			}
		});

		this.ddpConnection._stream.on('reset', () => {
			super.emit.call(this, '__reconnect__');
		});
	}

	get name() {
		return this._name;
	}

	set name(name) {
		check(name, String);
		this._name = name;
	}

	get subscriptionName() {
		return `stream-${this.name}`;
	}

	get useCollection() {
		return this._useCollection;
	}

	set useCollection(useCollection) {
		check(useCollection, Boolean);
		this._useCollection = useCollection;
	}

	stop(eventName) {
		return this.subscriptions[eventName] && this.subscriptions[eventName].subscription && this.subscriptions[eventName].subscription.stop();
	}

	stopAll() {
		Object.keys(this.subscriptions).forEach(eventName => this.removeAllListeners(eventName));
	}

	unsubscribe(eventName) {
		delete this.subscriptions[eventName];
		super.removeAllListeners(eventName);
	}

	subscribe(eventName, args) {
		if (this.subscriptions[eventName]) {
			return;
		}
		const subscription = Tracker.nonreactive(() => this.ddpConnection.subscribe(
			this.subscriptionName,
			eventName,
			{ useCollection: this.useCollection, args },
			{ onStop: () => this.unsubscribe(eventName) }
		));
		this.subscriptions[eventName] = { subscription };
	}

	onReconnect(fn) {
		if (typeof fn === 'function') {
			super.on('__reconnect__', fn);
		}
	}

	getLastMessageFromEvent(eventName) {
		const subscription = this.subscriptions[eventName];
		if (subscription && subscription.lastMessage) {
			return subscription.lastMessage;
		}
	}

	removeAllListeners(eventName) {
		super.removeAllListeners(eventName);
		return this.stop(eventName);
	}

	removeListener(eventName, ...args) {
		if (this.listenerCount(eventName) === 1) {
			this.stop(eventName);
		}
		super.removeListener(eventName, ...args);
	}

	on(eventName, ...args) {
		check(eventName, NonEmptyString);

		const callback = args.pop();
		check(callback, Function);

		this.subscribe(eventName, args);
		super.on(eventName, callback);
	}

	once(eventName, ...args) {
		check(eventName, NonEmptyString);

		const callback = args.pop();
		check(callback, Function);

		this.subscribe(eventName, args);

		super.once(eventName, (...args) => {
			callback(...args);
			if (this.listenerCount(eventName) === 0) {
				return this.stop(eventName);
			}
		});
	}

	emit(...args) {
		this.ddpConnection.call(this.subscriptionName, ...args);
	}
};
