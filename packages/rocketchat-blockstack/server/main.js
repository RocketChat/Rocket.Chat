import blockstack from 'blockstack'

if (!Accounts.blockstack) Accounts.blockstack = {}

// Get user data from auth token
Accounts.blockstack.getUserData = () => blockstack.loadUserData()

// Define path configs for generated files and routes
Accounts.blockstack.manifestPath = '/packages/rocketchat_blockstack/assets/manifest.json'
Accounts.blockstack.redirectPath = '_blockstack/validate'
