import { jest } from '@jest/globals';

export const Meteor = {
	loginWithSamlToken: jest.fn((_token, callback: () => void) => callback()),
	connection: {
		_stream: { on: jest.fn() },
	},
	_localStorage: {
		getItem: jest.fn(),
		setItem: jest.fn(),
	},
	users: {},
	userId: () => 'uid',
	_SynchronousQueue: class _SynchronousQueue {
		drain = jest.fn();
	},
	_runFresh: jest.fn(),
	_isPromise: jest.fn(() => false),
};

export const Mongo = {
	Collection: class Collection {
		_collection = {
			_docs: {},
		};

		find = jest.fn(() => ({
			fetch: jest.fn(() => []),
			observe: jest.fn(),
		}));

		findOne = jest.fn();

		update = jest.fn();
	},
};

export const Accounts = {
	onLogin: jest.fn(),
	onLogout: jest.fn(),
};

export const Tracker = { autorun: jest.fn() };

export const ReactiveVar = class ReactiveVar {};

export const EJSON = {
	isBinary: jest.fn(() => false),
	clone: jest.fn((obj) => obj),
};
