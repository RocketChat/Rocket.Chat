export const Meteor = {
	isClient: true,
	isServer: false,
	_localStorage: window.localStorage,
	absoluteUrl: () => {},
	userId: () => {},
	Streamer: () => ({
		on: () => {},
		removeListener: () => {},
	}),
	startup: () => {},
	methods: () => {},
	call: () => {},
};

Meteor.absoluteUrl.defaultOptions = {};

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
		set: (val) => { currentVal = val; },
	};
};

export const ReactiveDict = () => ({
	get: () => {},
	set: () => {},
	all: () => {},
});

export const Template = () => ({
	onCreated: () => {},
	onRendered: () => {},
	onDestroyed: () => {},
	helpers: () => {},
	events: () => {},
});

Template.registerHelper = () => {};
Template.__checkName = () => {};

export const Blaze = {
	Template,
	registerHelper: () => {},
};

window.Blaze = Blaze;

export const check = () => {};

export const FlowRouter = {
	route: () => {},
	group: () => ({
		route: () => {},
	}),
};

export const BlazeLayout = {};

export const Session = {
	get: () => {},
	set: () => {},
};
