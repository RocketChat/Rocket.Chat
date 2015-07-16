Future = Npm.require('fibers/future');
/**
 * This code is largely based on the meteor-accounts-ldap (https://github.com/typ90/meteor-accounts-ldap) 
 * package contributed by Eric Typaldos (https://github.com/typ90)
 * 
 * uses directoryService.js
 */
AccountManager = function(accountProvider) {
	var id = 'jedis';
	var accountProvider = accountProvider;
	var getAuthId = function() {
		return this.id;
	}	


	/**
	 * Authenticates user against underlying account provider.  If successful, retireves user information
	 * from account provider and updates Mongo. 
	 *  
	 * @param  {username:string, jedisPass:string} loginOptions authentication credentials
	 * @return {[type]}              [description]
	 */
	var loginHandler = function(loginOptions) { 
		var user,
			providerResponse,
			future,
			stampedToken,
			hashStampedToken,
			classificationIds;

		console.log('Attempting to login user: ' + loginOptions.username);

		if( !accountProvider ) {
			console.log("Account provider not initialized");
			return {userId:undefined, error: new Meteor.Error(403, 'Authorization handler not ready')};
		}

		if (!loginOptions.jedis) {
			return undefined;
		}

		// if it worked, then returns user object from account provider, otherwise error
		providerResponse = accountProvider.AuthenticateUser(loginOptions);

		if (providerResponse.error) {
			return  { userId: null, error: new Meteor.Error(403, providerResponse.error) }
		}

		console.log('login successful');
		// we can assume the user authenticated properly and 'user' contains the latest user information
		// from account provider
		user = providerResponse.user;

		// add classification ids to user's access permissions
		classificationIds = _.pluck(Jedis.accessManager.getClassifications(), '_id');	
		accesses =  user.profile.access || [];
		user.profile.access = accesses.concat( classificationIds );
		
		future = new Future();
		// update user information with latest from account provider 
		result = upsertUser(user);
		if( result.error ) {
			future.return({userId:null, error:'Error finding user: ' + user._id});
		}

		// add a resume token so that Meteor can resume session on reconnect
		stampedToken = Accounts._generateStampedLoginToken();
		hashStampedToken = Accounts._hashStampedToken(stampedToken);
		Meteor.users.update(user._id, {
			$push: { 'services.resume.loginTokens': hashStampedToken }},
			function(err, result) {
				if( err) {
					console.log(err);
					future.return({error: err});
				} else {
					console.log('existing user: ' + user._id);
					future.return({ userId: user._id,
									token: stampedToken});
				}
			}
		);

		return future.wait();
	}

	var upsertUser = function(user) {
		var future = new Future();
		Meteor.users.upsert({_id:user._id}, {$set: user}, function( err, result) {
			if( err ) {
				future.return({error:err});

			} else if( result.insertedId ) {
				console.log('inserted new user: ' + result.insertedId);
				user._id = result.insertedId;
				future.return({user: user});

			} else {
				console.log('updated user: ' + user._id);
				future.return({user:user});
			}
		});

		return future.wait();
	}

	/**
	 * Retrieve all users from underlying account provider (e.g. LDAP) and add to Mongo Users. 
	 * If user exists, then update, otherwise insert new account.  
	 * @return {[type]} [description]
	 */
	var loadUsers = function() {
		// Note: if we remove all users then insert, logged in users may be kicked off and forced to  
		// re-login. 
		 
		var providerUsers = accountProvider.getUsers() || [],
			providerUserIds = [],
			usersToRemove = [],
			classificationIds = [];

		classificationIds = _.pluck(Jedis.accessManager.getClassifications(), '_id');
		// remove users from Mongo that do not exist in account provider.  e.g. users that have been deleted 
		// from LDAP and should not be able to login.  
		// TODO : should we set a flag instead of deleting the user account? this will 
		// remove users created by RocketChat
		Meteor.users.find().forEach( function(user) {
			usersToRemove.push(user._id);
		}); 

		console.log(usersToRemove);
		 
		// create or update meteor accounts that exist account provider
		providerUsers.forEach(function(user) { 
			var result,
				accesses;
			// insert system classificationIds into users's profile.access array
			accesses =  user.profile.access || [];
			user.profile.access = accesses.concat( classificationIds );
			result = upsertUser(user);
			if( result.error ) {
				console.log('Error loading user: ' + user._id);
			} else {
				providerUserIds.push(user._id);
				console.log('loaded user: ' + user._id);
			}
		});

		usersToRemove = _.difference(usersToRemove, providerUserIds);
		Meteor.users.remove( {_id : {$in : usersToRemove}});
		console.log('removed users: ' + usersToRemove);
	}

	return {
		/**
		 * Authenticates using underlying account provider instance
		 * @type {[type]}
		 */
		loginHandler : loginHandler,

		/**
		 * Populates meteor database (using Accounts.createUser) with all users from underlying account provider.
		 * Updates existing users and creates Account for non-existant Meteor users.
		 */
		loadUsers : loadUsers,

		/**
		 * Unique identifier 
		 * @type {[type]}
		 */
		authId : id
	}

};
