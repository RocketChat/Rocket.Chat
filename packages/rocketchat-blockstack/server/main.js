// Setup namespace for helpers
if (!Accounts.blockstack) {
	Accounts.blockstack = {};
}

// Define path configs for generated files and routes
Accounts.blockstack.manifestPath = '_blockstack/manifest';
Accounts.blockstack.redirectPath = '_blockstack/validate';

// Set to determine type of auth required
Meteor.isDevelopment = (process.env.ROOT_URL.indexOf('localhost') !== -1);
