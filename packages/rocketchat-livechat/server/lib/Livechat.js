RocketChat.Livechat = {
	getNextAgent(department) {
		if (department) {
			return RocketChat.models.LivechatDepartmentAgents.getNextAgentForDepartment(department);
		} else {
			return RocketChat.models.Users.getNextAgent();
		}
	},
	sendMessage({ guest, message, roomInfo }) {
		var room = RocketChat.models.Rooms.findOneById(message.rid);
		var newRoom = false;

		if (room && !room.open) {
			message.rid = Random.id();
			room = null;
		}

		if (room == null) {

			// if no department selected verify if there is only one active and use it
			if (!guest.department) {
				var departments = RocketChat.models.LivechatDepartment.findEnabledWithAgents();
				if (departments.count() === 1) {
					guest.department = departments.fetch()[0]._id;
				}
			}

			const agent = RocketChat.Livechat.getNextAgent(guest.department);
			if (!agent) {
				throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
			}

			const roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode();

			room = _.extend({
				_id: message.rid,
				msgs: 1,
				lm: new Date(),
				code: roomCode,
				usernames: [agent.username, guest.username],
				t: 'l',
				ts: new Date(),
				v: {
					token: message.token
				},
				open: true
			}, roomInfo);
			let subscriptionData = {
				rid: message.rid,
				name: guest.username,
				alert: true,
				open: true,
				unread: 1,
				answered: false,
				code: roomCode,
				u: {
					_id: agent.agentId,
					username: agent.username
				},
				t: 'l',
				desktopNotifications: 'all',
				mobilePushNotifications: 'all',
				emailNotifications: 'all'
			};

			RocketChat.models.Rooms.insert(room);
			RocketChat.models.Subscriptions.insert(subscriptionData);

			newRoom = true;
		} else {
			room = Meteor.call('canAccessRoom', message.rid, guest._id);
		}
		if (!room) {
			throw new Meteor.Error('cannot-acess-room');
		}
		return _.extend(RocketChat.sendMessage(guest, message, room), { newRoom: newRoom });
	},
	registerGuest({ token, name, email, department, phone, loginToken, username } = {}) {
		check(token, String);

		const user = RocketChat.models.Users.getVisitorByToken(token, { fields: { _id: 1 } });

		if (user) {
			throw new Meteor.Error('token-already-exists', 'Token already exists');
		}

		if (!username) {
			username = RocketChat.models.Users.getNextVisitorUsername();
		}

		let updateUser = {
			$set: {
				profile: {
					guest: true,
					token: token
				}
			}
		};

		var existingUser = null;

		var userId;

		if (s.trim(email) !== '' && (existingUser = RocketChat.models.Users.findOneByEmailAddress(email))) {
			if (existingUser.type !== 'visitor') {
				throw new Meteor.Error('error-invalid-user', 'This email belongs to a registered user.');
			}

			updateUser.$addToSet = {
				globalRoles: 'livechat-guest'
			};

			if (loginToken) {
				updateUser.$addToSet['services.resume.loginTokens'] = loginToken;
			}

			userId = existingUser._id;
		} else {
			updateUser.$set.name = name;

			var userData = {
				username: username,
				globalRoles: ['livechat-guest'],
				department: department,
				type: 'visitor'
			};

			if (this.connection) {
				userData.userAgent = this.connection.httpHeaders['user-agent'];
				userData.ip = this.connection.httpHeaders['x-real-ip'] || this.connection.clientAddress;
				userData.host = this.connection.httpHeaders.host;
			}

			userId = Accounts.insertUserDoc({}, userData);

			if (loginToken) {
				updateUser.$set.services = {
					resume: {
						loginTokens: [ loginToken ]
					}
				};
			}
		}

		if (phone) {
			updateUser.$set.phone = [
				{ phoneNumber: phone.number }
			];
		}

		if (email && email.trim() !== '') {
			updateUser.$set.emails = [
				{ address: email }
			];
		}

		Meteor.users.update(userId, updateUser);

		return userId;
	},

	saveGuest({ _id, name, email, phone }) {
		let updateData = {};

		if (name) {
			updateData.name = name;
		}
		if (email) {
			updateData.email = email;
		}
		if (phone) {
			updateData.phone = phone;
		}
		return RocketChat.models.Users.saveUserById(_id, updateData);
	},

	closeRoom({ user, room, comment }) {
		RocketChat.models.Rooms.closeByRoomId(room._id);

		const message = {
			t: 'livechat-close',
			msg: comment,
			groupable: false
		};

		RocketChat.sendMessage(user, message, room);

		RocketChat.models.Subscriptions.hideByRoomIdAndUserId(room._id, user._id);

		return true;
	}
};
