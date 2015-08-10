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
	test();

	// based on setUsername.coffee that adds uesrs after registration.  We can't reuse it because
	// it checks Meteor.userId which doesn't apply to what we're doing
	addUsersToRoom(users, 'GENERAL', false);

	// Register our custom login manager that authenticates via LDAP with Meteor's accounts package
	Accounts.registerLoginHandler(Jedis.accountManager.authId, Jedis.accountManager.loginHandler);	
	// TODO checkt that forbidClientAccountCreation is true
	//Accounts.config( {forbidClientAccountCreation:true});
});

var test = function() {
	var owner = Meteor.users.findOne({_id:'testadmin'});
	var rawUsers = Meteor.users.rawCollection();
	var pipeline = [{'$group': {_id:'$profile.location', usernames: {$push : "$username"}}}]
	Meteor.wrapAsync( rawUsers.aggregate, rawUsers)(pipeline, function(err, usersByLocation) {
		if( err ) {
			console.log( err )
		} else {
			console.dir( usersByLocation );
			usersByLocation.forEach(function(location) {
				var channel = ChatRoom.findOne({name:location._id, t:'c'});
				if( channel ) {
					// location exists so add user if they don't already belong
					addUsersToRoom(location.usernames, channel._id, false)
				} else {
					// location doesn't exist so create new channel with users
					createChannel(owner, location._id, location.usernames);
				}
			})
		}

	})
}

var addUsersToRoom = function( users, roomId, createJoinedMessage) {
	var now = new Date();
	var room = ChatRoom.findOne({_id: roomId})
	if( ! room ) {
		console.log( 'Room with id: ' + roomId + ' not found');
		return
	}
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
				rid: roomId,
				name: room.name,
				ts: now,
				t: room.t,
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

var createChannel = function(owner, name, members) {
	// the same as createChannel method, except it doesn't check for logged in user
	if( !(/^[0-9a-z-_\s.]+$/i).test(name)) {
		throw new Meteor.Error( 'name-invalid' );
	}

	var now = new Date()

	// avoid duplicate names
	if (ChatRoom.findOne({name:name})) {
		throw new Meteor.Error ('duplicate-name')
	}

	room = {
		usernames: members,
		ts: now,
		t: 'c',
		name: name,
		msgs: 0,
		u: {
			_id: owner._id,
			username: owner.username
		}
	}

	RocketChat.callbacks.run('beforeCreateChannel', owner, room);

	// create new room
	var rid = ChatRoom.insert( room )

	members.forEach(function(username) {
		member = Meteor.users.findOne({username: username})
		if (member) {

			sub = {
				rid: rid,
				ts: now,
				name: name,
				t: 'c',
				unread: 0,
				u: {
					_id: member._id,
					username: username
				}
			}

			if(username === owner.username) {
				sub.ls = now
				sub.open = true
			}

			ChatSubscription.insert (sub);
		}
	});

	Meteor.defer(function() { 
		RocketChat.callbacks.run( 'afterCreateChannel', owner, room);
	});

	return {
		rid: rid
	}	
}

