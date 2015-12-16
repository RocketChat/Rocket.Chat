Meteor.methods({
	registerGuest: function(token, name, email) {
		console.log('registerGuest ->'.green, token);
		var pass, qt, user, userData, userExists, userId, inc = 0;
		check(token, String);
		user = Meteor.users.findOne({
			"profile.token": token
		}, {
			fields: {
				_id: 1
			}
		});
		if (user != null) {
			throw new Meteor.Error('token-already-exists', 'Token already exists');
		}
		while (true) {
			qt = Meteor.users.find({
				'profile.guest': true
			}).count() + 1;
			user = 'guest-' + (qt + inc++);
			userExists = Meteor.users.findOne({
				'username': user
			}, {
				fields: {
					_id: 1
				}
			});
			console.log('userExists ->',userExists);
			if (!userExists) {
				break;
			}
		}
		userData = {
			username: user,
			globalRoles: 'livechat-guest'
		};
		userId = Accounts.insertUserDoc({}, userData);

		updateUser = {
			name: name || user,
			"profile.guest": true,
			"profile.token": token
		}

		if (email && email.trim() !== "") {
			updateUser.emails = [{ "address": email }];
		}

		var stampedToken = Accounts._generateStampedLoginToken();
		var hashStampedToken = Accounts._hashStampedToken(stampedToken);

		updateUser.services = {
			resume: {
				loginTokens: [ hashStampedToken ]
			}
		};

		Meteor.users.update(userId, {
			$set: updateUser
		});
		return {
			userId: userId,
			token: stampedToken.token
		};
	}
});
