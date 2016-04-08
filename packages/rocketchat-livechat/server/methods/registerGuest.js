Meteor.methods({
	'livechat:registerGuest': function({ token, name, email, department } = {}) {
		var qt, user, userData, userExists, userId, inc = 0;

		check(token, String);

		user = Meteor.users.findOne({
			'profile.token': token
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

			if (!userExists) {
				break;
			}
		}
		userData = {
			username: user,
			globalRoles: ['livechat-guest'],
			department: department,
			type: 'visitor'
		};

		userData.userAgent = this.connection.httpHeaders['user-agent'];
		userData.ip = this.connection.httpHeaders['x-real-ip'] || this.connection.clientAddress;
		userData.host = this.connection.httpHeaders.host;

		userId = Accounts.insertUserDoc({}, userData);

		const updateUser = {
			name: name || user,
			'profile.guest': true,
			'profile.token': token
		};

		if (email && email.trim() !== '') {
			updateUser.emails = [{ address: email }];
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

		// update visited page history to not expire
		RocketChat.models.LivechatPageVisitied.keepHistoryForToken(token);

		return {
			userId: userId,
			token: stampedToken.token
		};
	}
});
