Package.describe({
	name: 'rocketchat:server-runtime',
	version: '0.0.1',
	summary: "Meteor's server runtime, kept out of the browser bundle",
	git: '',
});

// The web client talks to the server over DDPSDK and REST only, so the DDP client, accounts, minimongo and
// hot-code-push halves of these packages must not ship to the browser.
const serverPackages = [
	// Sets the Mongo connection options, so it has to load before any package creates a collection.
	'rocketchat:mongo-config',
	'meteor-base@1.5.2',
	'accounts-base@3.3.1',
	'accounts-password@3.3.1',
	'check@1.5.0',
	'ddp-rate-limiter@1.3.0',
	'rate-limit@1.2.0',
	'email@3.2.0',
	'ddp-common@1.4.5',
	'webapp@2.3.0',
	'mongo@2.5.1',
	'reload@1.3.2',
	'service-configuration@1.3.5',
	'session@1.2.3',
	'shell-server@0.7.0',
	'routepolicy@1.1.2',
	'webapp-hashing@1.1.2',
	'facts-base@1.0.2',
	'tracker@1.3.4',
	'reactive-dict@1.3.2',
	'reactive-var@1.0.13',
	'autoupdate@2.0.1',
	'dispatch:run-as-user',
	'ostrio:cookies',
	'meteorhacks:inject-initial',
];

Package.onUse(function (api) {
	api.use(serverPackages, 'server');
	api.imply(serverPackages, 'server');
});
