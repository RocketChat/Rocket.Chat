export const Meteor = {
	Device: {
		isDesktop: () => false,
	},
	isClient: true,
	isServer: false,
	_localStorage: window.localStorage,
	absoluteUrl: Object.assign(() => undefined, {
		defaultOptions: {},
	}),
	userId: () => undefined,
	Streamer: () => ({
		on: () => undefined,
		removeListener: () => undefined,
	}),
	StreamerCentral: {
		on: () => undefined,
		removeListener: () => undefined,
	},
	startup: () => undefined,
	methods: () => undefined,
	call: () => undefined,
	connection: {
		_stream: {
			on: () => undefined,
		},
	},
	users: {},
};

export const Tracker = {
	autorun: () => ({
		stop: () => undefined,
	}),
	nonreactive: (fn: () => void) => fn(),
	Dependency: () => undefined,
};

export const Accounts = {
	onLogin: () => undefined,
	onLogout: () => undefined,
};

export const Mongo = {
	Collection: () => ({
		find: () => ({
			observe: () => undefined,
			fetch: () => [],
		}),
	}),
};

export const ReactiveVar = <T>(val: T) => {
	let currentVal = val;
	return {
		get: () => currentVal,
		set: (val: T) => {
			currentVal = val;
		},
	};
};

export const ReactiveDict = () => ({
	get: () => undefined,
	set: () => undefined,
	all: () => undefined,
});

export const Template = Object.assign(
	() => ({
		onCreated: () => undefined,
		onRendered: () => undefined,
		onDestroyed: () => undefined,
		helpers: () => undefined,
		events: () => undefined,
	}),
	{
		registerHelper: () => undefined,
		__checkName: () => undefined,
	},
);

export const check = () => undefined;

export const FlowRouter = {
	route: () => undefined,
	group: () => ({
		route: () => undefined,
	}),
};

export const Session = {
	get: () => undefined,
	set: () => undefined,
};
