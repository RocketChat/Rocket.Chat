import { fn } from 'jest-mock';

export const Meteor = {
	loginWithSamlToken: fn((_token, callback: () => void) => callback()),
	connection: {
		_stream: { on: fn() },
	},
	_localStorage: {
		getItem: fn(),
		setItem: fn(),
	},
	users: {},
	userId: () => 'uid',
	_SynchronousQueue: class _SynchronousQueue {
		drain = fn();
	},
	_runFresh: fn(),
	_isPromise: fn(() => false),
	defer: fn((fn: () => void) => queueMicrotask(fn)),
};

export const Mongo = {
	Collection: class Collection {
		_collection = {
			_docs: {},
		};

		find = fn(() => ({
			fetch: fn(() => []),
			observe: fn(),
		}));

		findOne = fn();

		update = fn();
	},
};

export const Accounts = {
	onLogin: fn(),
	onLogout: fn(),
};

export const Tracker = { autorun: fn() };

export const ReactiveVar = class ReactiveVar {};

export const EJSON = {
	isBinary: fn(() => false),
	clone: fn((obj) => obj),
	equals: fn((a, b) => JSON.stringify(a) === JSON.stringify(b)),
};

export const DDPCommon = {
	parseDDP: fn((msg: string) => JSON.parse(msg)),
	stringifyDDP: fn((msg: unknown) => JSON.stringify(msg)),
};
