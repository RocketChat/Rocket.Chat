Jedis = this.Jedis || {};

Meteor.startup( function() {
	var defaultSettings;
	var overwrite = false;
	var directoryService;

	console.log("Loading Default System Settings");
	try {
		// JSON.parse is very syntax sensitive.  e.g. trailing comma with no following value 
		// will cause an error. 
		defaultSettings = JSON.parse(Assets.getText('defaultSettings.json')) || {};
		Jedis.settings = new JedisSettings();
		Jedis.settings.load(defaultSettings, overwrite);	
	} catch(err) {
		console.log('Error loading default settings: ' + err.message);
	}

	directoryService = new DirectoryService(Jedis.settings.get('ldap'));
	Jedis.accessManager = new AccessManager(directoryService);
	Jedis.accessManager.loadAccessPermissions();

	Jedis.accountManager = new AccountManager(directoryService);
	Jedis.accountManager.loadUsers();

	// Register our custom login manager that authenticates via LDAP with Meteor's accounts package
	Accounts.registerLoginHandler(Jedis.accountManager.authId, Jedis.accountManager.loginHandler);	
	Accounts.config( {forbidClientAccountCreation:true});

});