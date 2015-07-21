Jedis = this.Jedis || {};

Meteor.startup( function() {
	var defaultSettings;
	var overwrite = false;
	var directoryService;
	var users = [];

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

	// returns non-jedis users that will be added to GENERAL room if they aren't already added
	users = Meteor.users.find().fetch();

	// based on setUsername.coffee that adds uesrs after registration.  We can't reuse it because
	// it checks Meteor.userId which doesn't apply to what we're doing
	addUsersToRoom(users, 'GENERAL', false);

	// Register our custom login manager that authenticates via LDAP with Meteor's accounts package
	Accounts.registerLoginHandler(Jedis.accountManager.authId, Jedis.accountManager.loginHandler);	
	Accounts.config( {forbidClientAccountCreation:true});
});

var addUsersToRoom = function( users, roomId, createJoinedMessage) {
	var now = new Date();
	// add usernames to specified room and create subscription.  
	users.forEach( function( user ) {

		if( ! ChatSubscription.findOne({rid: roomId, 'u._id' : user._id }) ) {
			// Non-existant ChatSubscription implies user missing from ChatRoom
			ChatRoom.update( {_id: roomId }, 
				{
					// can't use addToSet because sort doesn't work.
					$push : 
					{ usernames : 
						{
						$each : [user.username],
						$sort : 1
						}
					}
				});

			ChatSubscription.insert( {
				rid: 'GENERAL',
				name: 'general',
				ts: now,
				t: 'c',
				f: true,
				open: true,
				alert: true,
				unread : createJoinedMessage ? 1 : 0,
				u: { _id : user._id, username : user.username }
			});

			if( createJoinedMessage ) {
				ChatMessage.insert({
					rid: roomId,
					ts: now,
					t: 'uj',
					msg : '',
				u: { _id : user._id, username : user.username }
				})
			}
		}
	});
}