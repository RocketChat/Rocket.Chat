import sinon from 'sinon';
const events = require('events');

const subscribeMock = jest.fn(() => ({
	ready: jest.fn(() => true),
	stop: sinon.stub(),
}));
const callMock = sinon.stub();
const applyMock = sinon.stub();

class MockLocalStorage {
	store: {};
	constructor() {
		this.store = {};
	}

	getItem(key) {
		return this.store[key] || null;
	}

	setItem(key, value) {
		this.store[key] = String(value);
	}

	removeItem(key) {
		delete this.store[key];
	}

	clear() {
		this.store = {};
	}
}

module.exports = {
	Meteor: {
		loginWithSamlToken: sinon.stub(),
		subscribe: subscribeMock,
		call: callMock,
		apply: applyMock,
		methods: sinon.stub(),
		connection: {
			subscribe: subscribeMock,
			call: callMock,
			apply: applyMock,
			status: sinon.stub(() => ({ connected: true })),
			reconnect: sinon.stub(),
			disconnect: sinon.stub(),
			_stream: new events.EventEmitter(),
		},
		isClient: true,
		isServer: false,
		_localStorage: new MockLocalStorage(),
	},
	Mongo: {
		Collection: class Collection {
			name: any;
			find: sinon.SinonStub<any[], any>;
			findOne: sinon.SinonStub<any[], any>;
			insert: sinon.SinonStub<any[], any>;
			update: sinon.SinonStub<any[], any>;
			remove: sinon.SinonStub<any[], any>;
			constructor(name) {
				this.name = name;
				this.find = sinon.stub().returns({
					fetch: () => [{ _id: '1', name: 'Document' }],
					count: () => 1,
					observe: sinon.stub(),
				});
				this.findOne = sinon.stub().returns({ _id: '1', name: 'Document' });
				this.insert = sinon.stub();
				this.update = sinon.stub();
				this.remove = sinon.stub();
			}
		},
	},
	Accounts: {
		createUser: sinon.stub(),
		findUserByEmail: sinon.stub(),
		findUserByUsername: sinon.stub(),
		validateLoginAttempt: sinon.stub(),
		onLogin: sinon.stub(),
		onLoginFailure: sinon.stub(),
	},
	check: sinon.stub(),
	Match: {
		Maybe: sinon.stub(),
		OneOf: sinon.stub(),
		ObjectIncluding: sinon.stub(),
		Where: sinon.stub(),
	},
	Tracker: {
		autorun: sinon.stub(),
		nonreactive: sinon.stub(),
		Dependency: class {
			depend: sinon.SinonStub<any[], any>;
			changed: sinon.SinonStub<any[], any>;
			constructor() {
				this.depend = sinon.stub();
				this.changed = sinon.stub();
			}
		},
	},
	ReactiveVar: class ReactiveVar {
		value: any;
		dep: any;
		constructor(initialValue) {
			this.value = initialValue;
			this.dep = new (require('meteor/tracker').Tracker.Dependency)();
		}

		get() {
			this.dep.depend();
			return this.value;
		}

		set(newValue) {
			if (this.value !== newValue) {
				this.value = newValue;
				this.dep.changed();
			}
		}
	},
	ReactiveDict: class ReactiveDict {
		dict: Map<any, any>;
		deps: {};
		constructor(initialValues) {
			this.dict = new Map();
			this.deps = {};

			if (initialValues) {
				for (const [key, value] of Object.entries(initialValues)) {
					this.set(key, value);
				}
			}
		}

		get(key) {
			if (!this.deps[key]) {
				this.deps[key] = new Tracker.Dependency();
			}
			this.deps[key].depend();
			return this.dict.get(key);
		}

		set(key, value) {
			const oldValue = this.dict.get(key);
			if (oldValue !== value) {
				this.dict.set(key, value);
				if (this.deps[key]) {
					this.deps[key].changed();
				}
			}
		}

		equals(key, value) {
			const currentValue = this.get(key);
			return currentValue === value;
		}

		all() {
			return Object.fromEntries(this.dict);
		}
	},
};
