RocketChat.Livechat = {
	getNextAgent(department) {
		if (department) {
			return RocketChat.models.LivechatDepartmentAgents.getNextAgentForDepartment(department);
		} else {
			return RocketChat.models.Users.getNextAgent();
		}
	},
	sendMessage({ guest, message, roomInfo }) {
		var agent, room;

		room = RocketChat.models.Rooms.findOneById(message.rid);
		if (room == null) {

			// if no department selected verify if there is only one active and use it
			if (!guest.department) {
				var departments = RocketChat.models.LivechatDepartment.findEnabledWithAgents();
				if (departments.count() === 1) {
					guest.department = departments.fetch()[0]._id;
				}
			}

			agent = RocketChat.Livechat.getNextAgent(guest.department);
			if (!agent) {
				throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
			}

			const roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode();

			room = _.extend({
				_id: message.rid,
				name: guest.username,
				msgs: 1,
				lm: new Date(),
				code: roomCode,
				usernames: [agent.username, guest.username],
				t: 'l',
				ts: new Date(),
				v: {
					token: message.token
				}
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
		} else {
			room = Meteor.call('canAccessRoom', message.rid, guest._id);
		}
		if (!room) {
			throw new Meteor.Error('cannot-acess-room');
		}
		return RocketChat.sendMessage(guest, message, room);
	},
	registerGuest({ token, name, email, department, phone, loginToken, username } = {}) {
		check(token, String);

		const user = RocketChat.models.Users.getVisitorByToken(token, { fields: { _id: 1 } });

		if (user) {
			throw new Meteor.Error('token-already-exists', 'Token already exists');
		}

		if (!username) {
			username = RocketChat.models.Users.getNextVisitorUsername();
		} else {
			// const existingUser = RocketChat.models.Users.findOneByUsername(username);

			// if (existingUser) {
			// 	throw new Meteor.Error
			// }
		}

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

		const userId = Accounts.insertUserDoc({}, userData);

		let updateUser = {
			name: name,
			profile: {
				guest: true,
				token: token
			}
		};

		if (phone) {
			updateUser.phone = [
				{ phoneNumber: phone.number }
			];
		}

		if (email && email.trim() !== '') {
			updateUser.emails = [{ address: email }];
		}

		if (loginToken) {
			updateUser.services = {
				resume: {
					loginTokens: [ loginToken ]
				}
			};
		}

		Meteor.users.update(userId, {
			$set: updateUser
		});

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
	}
};
