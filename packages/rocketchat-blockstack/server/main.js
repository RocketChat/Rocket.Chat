if (!Accounts.blockstack) Accounts.blockstack = {}

// Determine type of auth required
Meteor.isDevelopment = (process.env.ROOT_URL.indexOf('localhost') != -1)

// Define path configs for generated files and routes
Accounts.blockstack.manifestPath = '_blockstack/manifest'
Accounts.blockstack.redirectPath = '_blockstack/validate'
Accounts.blockstack.authHost = Meteor.isDevelopment ? 'http://localhost:8888/' : 'https://blockstack.org/auth'
