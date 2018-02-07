if (!Accounts.blockstack) Accounts.blockstack = {}

// Define path configs for generated files and routes
Accounts.blockstack.manifestPath = '_blockstack/manifest'
Accounts.blockstack.redirectPath = '_blockstack/validate'

// Determine type of auth required
Meteor.isDevelopment = (process.env.ROOT_URL.indexOf('localhost') != -1)
Accounts.blockstack.authHost = Meteor.isDevelopment ? 'http://localhost:8888/auth' : 'https://blockstack.org/auth'
