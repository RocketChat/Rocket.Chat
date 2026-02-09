import { Accounts } from './accounts-base.ts';
import { isKey } from './utils/isKey.ts';

const services = Object.create(null);

// Helper for registering OAuth based accounts packages.
// On the server, adds an index to the user collection.
const registerService = <T extends string>(name: T) => {
	if (isKey(services, name)) throw new Error(`Duplicate service: ${name}`);
	services[name] = true;
};

// Removes a previously registered service.
// This will disable logging in with this service, and serviceNames() will not
// contain it.
// It's worth noting that already logged in users will remain logged in unless
// you manually expire their sessions.
const unregisterService = <T extends string>(name: T) => {
	if (!isKey(services, name)) throw new Error(`Service not found: ${name}`);
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
