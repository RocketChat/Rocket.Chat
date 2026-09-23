// Stands in for every `meteor/*` import in the Vite build, where Meteor's
// client packages do not exist. Each export is an inert deep proxy that warns
// once when first touched, so the bundle boots and the console lists which
// Meteor APIs still have callers that need a native replacement.
const warned = new Set<string>();

// A function declaration (unlike an arrow) is constructible, so `class X extends Mongo.Collection` still evaluates.
function inert() {
	return undefined;
}

const unavailable = (name: string): any => {
	const warn = () => {
		if (warned.has(name)) return;
		warned.add(name);
		console.warn(`[vite] ${name} is not available outside the Meteor build`, new Error().stack);
	};

	const proxy: any = new Proxy(inert, {
		get: (_target, prop) => {
			if (prop === Symbol.toPrimitive) return () => '';
			if (prop === 'then') return undefined;
			warn();
			return proxy;
		},
		apply: () => {
			warn();
			return proxy;
		},
		construct: () => {
			warn();
			return proxy;
		},
		set: () => {
			warn();
			return true;
		},
	});

	return proxy;
};

export const Meteor = unavailable('Meteor');
export const Accounts = unavailable('Accounts');
export const Tracker = unavailable('Tracker');
export const Mongo = unavailable('Mongo');
export const MongoInternals = unavailable('MongoInternals');
export const OAuth = unavailable('OAuth');
export const DDPCommon = unavailable('DDPCommon');
export const Google = unavailable('Google');
export const Facebook = unavailable('Facebook');
export const Twitter = unavailable('Twitter');
export const MeteorDeveloperAccounts = unavailable('MeteorDeveloperAccounts');
export const WebApp = unavailable('WebApp');
