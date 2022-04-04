export const Meteor = {
	Device: {
		isDesktop: () => false,
	},
	isClient: true,
	isServer: false,
	_localStorage: window.localStorage,
	absoluteUrl: Object.assign(() => {}, {
		defaultOptions: {},
	}),
	userId: () => {},
	Streamer: () => ({
		on: () => {},
		removeListener: () => {},
	}),
	StreamerCentral: {
		on: () => {},
		removeListener: () => {},
	},
	startup: () => {},
	methods: () => {},
	call: () => {},
};

export const Tracker = {
	autorun: () => ({
		stop: () => {},
	}),
	nonreactive: (fn) => fn(),
	Dependency: () => {},
};

export const Accounts = {};

export const Mongo = {
	Collection: () => ({
		find: () => ({
			observe: () => {},
			fetch: () => [],
		}),
	}),
};

export const ReactiveVar = (val) => {
	let currentVal = val;
	return {
		get: () => currentVal,
		set: (val) => {
			currentVal = val;
		},
	};
};

export const ReactiveDict = () => ({
	get: () => {},
	set: () => {},
	all: () => {},
});

export const Template = Object.assign(
	() => ({
		onCreated: () => {},
		onRendered: () => {},
		onDestroyed: () => {},
		helpers: () => {},
		events: () => {},
	}),
	{
		registerHelper: () => {},
		__checkName: () => {},
	},
);

export const Blaze = {
	Template,
	registerHelper: () => {},
	renderWithData: () => {},
};

window.Blaze = Blaze;

export const check = () => {};

export const FlowRouter = {
	route: () => {},
	group: () => ({
		route: () => {},
	}),
};

export const Session = {
	get: () => {},
	set: () => {},
};
