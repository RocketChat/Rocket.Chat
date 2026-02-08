import { Accounts } from './accounts-base.ts';
import { hasOwn } from './utils/hasOwn.ts';

const services: Record<string, boolean> = {};

// Helper for registering OAuth based accounts packages.
// On the server, adds an index to the user collection.
const registerService = (name: string) => {
	if (hasOwn(services, name)) throw new Error(`Duplicate service: ${name}`);
	services[name] = true;
};

// Removes a previously registered service.
// This will disable logging in with this service, and serviceNames() will not
// contain it.
// It's worth noting that already logged in users will remain logged in unless
// you manually expire their sessions.
const unregisterService = (name: string) => {
	if (!hasOwn(services, name)) throw new Error(`Service not found: ${name}`);
	delete services[name];
};

const serviceNames = () => Object.keys(services);

Object.defineProperty(Accounts, 'oauth', {
	value: {
		registerService,
		unregisterService,
		serviceNames,
	},
});
