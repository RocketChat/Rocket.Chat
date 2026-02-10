import { EJSON } from './ejson.ts';
import { Meteor } from './meteor.ts';
import { Package } from './package-registry.ts';
import { Random } from './random.ts';
import { hasOwn } from './utils/hasOwn.ts';
import { isEmpty } from './utils/isEmpty.ts';
import { isKey } from './utils/isKey.ts';
import { noop } from './utils/noop.ts';

class Heartbeat {
	heartbeatInterval: number;

	heartbeatTimeout: number;

	_sendPing: (...args: unknown[]) => void;

	_onTimeout: (...args: unknown[]) => void;

	_seenPacket: boolean;

	_heartbeatIntervalHandle: any;

	_heartbeatTimeoutHandle: any;

	constructor(options: {
		heartbeatInterval: number;
		heartbeatTimeout: number;
		sendPing: (...args: unknown[]) => void;
		onTimeout: (...args: unknown[]) => void;
	}) {
		this.heartbeatInterval = options.heartbeatInterval;
		this.heartbeatTimeout = options.heartbeatTimeout;
		this._sendPing = options.sendPing;
		this._onTimeout = options.onTimeout;
		this._seenPacket = false;
		this._heartbeatIntervalHandle = null;
		this._heartbeatTimeoutHandle = null;
	}

	stop() {
		this._clearHeartbeatIntervalTimer();
		this._clearHeartbeatTimeoutTimer();
	}

	start() {
		this.stop();
		this._startHeartbeatIntervalTimer();
	}

	_startHeartbeatIntervalTimer() {
		this._heartbeatIntervalHandle = Meteor.setInterval(() => this._heartbeatIntervalFired(), this.heartbeatInterval);
	}

	_startHeartbeatTimeoutTimer() {
		this._heartbeatTimeoutHandle = Meteor.setTimeout(() => this._heartbeatTimeoutFired(), this.heartbeatTimeout);
	}

	_clearHeartbeatIntervalTimer() {
		if (this._heartbeatIntervalHandle) {
			Meteor.clearInterval(this._heartbeatIntervalHandle);
			this._heartbeatIntervalHandle = null;
		}
	}

	_clearHeartbeatTimeoutTimer() {
		if (this._heartbeatTimeoutHandle) {
			Meteor.clearTimeout(this._heartbeatTimeoutHandle);
			this._heartbeatTimeoutHandle = null;
		}
	}

	_heartbeatIntervalFired() {
		if (!this._seenPacket && !this._heartbeatTimeoutHandle) {
			this._sendPing();
			this._startHeartbeatTimeoutTimer();
		}

		this._seenPacket = false;
	}

	_heartbeatTimeoutFired() {
		this._heartbeatTimeoutHandle = null;
		this._onTimeout();
	}

	messageReceived() {
		this._seenPacket = true;

		if (this._heartbeatTimeoutHandle) {
			this._clearHeartbeatTimeoutTimer();
		}
	}
}

const SUPPORTED_DDP_VERSIONS = ['1', 'pre2', 'pre1'];

function parseDDP(stringMessage: string) {
	let msg: Record<string, any>;
	try {
		msg = JSON.parse(stringMessage);
	} catch (e) {
		Meteor._debug('Discarding message with invalid JSON', stringMessage);

		return null;
	}

	if (msg === null || typeof msg !== 'object') {
		Meteor._debug('Discarding non-object DDP message', stringMessage);

		return null;
	}

	if (hasOwn(msg, 'cleared')) {
		if (!isKey(msg, 'fields')) {
			msg.fields = {};
		}

		msg.cleared.forEach((clearKey: string) => {
			msg.fields[clearKey] = undefined;
		});

		delete msg.cleared;
	}

	['fields', 'params', 'result'].forEach((field) => {
		if (hasOwn(msg, field)) {
			msg[field] = EJSON._adjustTypesFromJSONValue(msg[field]);
		}
	});

	return msg;
}

function stringifyDDP(msg: any) {
	const copy = EJSON.clone(msg);

	if (hasOwn(msg, 'fields')) {
		const cleared: string[] = [];

		Object.keys(msg.fields).forEach((key) => {
			const value = msg.fields[key];

			if (typeof value === 'undefined') {
				cleared.push(key);
				delete copy.fields[key];
			}
		});

		if (!isEmpty(cleared)) {
			copy.cleared = cleared;
		}

		if (isEmpty(copy.fields)) {
			delete copy.fields;
		}
	}

	['fields', 'params', 'result'].forEach((field) => {
		if (hasOwn(copy, field)) {
			copy[field] = EJSON._adjustTypesToJSONValue(copy[field]);
		}
	});

	if (msg.id && typeof msg.id !== 'string') {
		throw new Error('Message id is not a string');
	}

	return JSON.stringify(copy);
}

type MethodInvocationOptions = {
	name: string;
	isSimulation: boolean;
	unblock?: (...args: unknown[]) => void;
	isFromCallAsync?: boolean;
	userId: string | null;
	setUserId?: (id: string | null) => void;
	connection?: any;
	randomSeed: string | (() => string);
	fence?: any;
};
export class MethodInvocation {
	name: string;

	isSimulation: boolean;

	_unblock: (...args: unknown[]) => void;

	_calledUnblock: boolean;

	_isFromCallAsync: boolean;

	userId: string | null;

	_setUserId: (id: string | null) => void;

	connection: any;

	randomSeed: string | (() => string);

	randomStream: any;

	fence: any;

	constructor(options: MethodInvocationOptions) {
		this.name = options.name;
		this.isSimulation = options.isSimulation;
		this._unblock = options.unblock || noop;
		this._calledUnblock = false;
		this._isFromCallAsync = !!options.isFromCallAsync;
		this.userId = options.userId;
		this._setUserId = options.setUserId || noop;
		this.connection = options.connection;
		this.randomSeed = options.randomSeed;
		this.randomStream = null;
		this.fence = options.fence;
	}

	unblock() {
		this._calledUnblock = true;
		this._unblock();
	}

	async setUserId(userId: string | null) {
		if (this._calledUnblock) {
			throw new Error("Can't call setUserId in a method after calling unblock");
		}

		this.userId = userId;
		await this._setUserId(userId);
	}
}

function randomToken() {
	return Random.hexString(20);
}

class RandomStream {
	seed: (string | (() => string))[];

	sequences: any;

	constructor(options: { seed?: any }) {
		this.seed = [].concat(options.seed || randomToken());
		this.sequences = Object.create(null);
	}

	_sequence(name: any) {
		let sequence = this.sequences[name] || null;

		if (sequence === null) {
			const sequenceSeed = this.seed.concat(name).map((s) => (typeof s === 'function' ? s() : s));

			sequence = Random.createWithSeeds.apply(null, sequenceSeed);
			this.sequences[name] = sequence;
		}

		return sequence;
	}

	static get(scope: { randomStream?: RandomStream; randomSeed?: any }, name: string): (typeof Random)['insecure'] {
		if (!name) {
			name = 'default';
		}

		if (!scope) {
			return Random.insecure;
		}

		let { randomStream } = scope;

		if (!randomStream) {
			randomStream = new RandomStream({
				seed: scope.randomSeed,
			});
			scope.randomStream = randomStream;
		}

		return randomStream._sequence(name);
	}
}

function makeRpcSeed(enclosing: any, methodName: string) {
	const stream = RandomStream.get(enclosing, `/rpc/${methodName}`);

	return stream.hexString(20);
}

export const DDPCommon = {
	Heartbeat,
	SUPPORTED_DDP_VERSIONS,
	parseDDP,
	stringifyDDP,
	MethodInvocation,
	RandomStream,
	makeRpcSeed,
};

Package['ddp-common'] = {
	DDPCommon,
};
