
Meteor.methods({
	createRequest(name, expertise = '', openingQuestion, members = [], environment) {
		const requestTitle = name;
		check(name, String);
		check(expertise, String);

		const getNextId = function() {
			// return HelpRequestApi.getNextAssistifyRoomCode();
			const settingsRaw = RocketChat.models.Settings.model.rawCollection();
			const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

			const query = {
				_id: 'Assistify_Room_Count'
			};

			const update = {
				$inc: {
					value: 1
				}
			};

			const findAndModifyResult = findAndModify(query, null, update);

			return findAndModifyResult.value.value;
		};

		const getExperts = function(expertise) {
			const expertiseRoom = RocketChat.models.Rooms.findOneByName(expertise);
			if (expertiseRoom) {
				return expertiseRoom.usernames;
			} else {
				return []; // even if there are no experts in the room, this is valid. A bot could notify later on about this flaw
			}
		};

		const createNotifications = function(roomId, usernames) {
			usernames.forEach((username) => {
				const user = RocketChat.models.Users.findOneByUsername(username);
				const room = RocketChat.models.Rooms.findOneById(roomId);
				let subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, user._id);
				if (!subscription) {
					subscription = RocketChat.models.Subscriptions.createWithRoomAndUser(room, user);
				}

				RocketChat.models.Subscriptions.updateDesktopNotificationsById(subscription._id, 'all');
				RocketChat.models.Subscriptions.updateMobilePushNotificationsById(subscription._id, 'all');
				RocketChat.models.Subscriptions.updateEmailNotificationsById(subscription._id, 'all');
			});
		};

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'createRequest'});
		}

		// if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-r')) {
		// 	throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createRequest' });
		// }

		// If an expertise has been selected, that means that a new room shall be created which addresses the
		// experts of this expertise. A new room name shall be created
		if (expertise && !name) {
			name = `${ expertise }-${ getNextId(expertise) }`;
		} else if (expertise && name) {
			name = `${ requestTitle }`;
		}

		if (expertise) {
			members = getExperts(expertise);
		}
		const roomCreateResult = RocketChat.createRoom('r', name, Meteor.user() && Meteor.user().username, members, false, {expertise});
		if (requestTitle) {
			RocketChat.saveRoomTopic (roomCreateResult.rid, expertise, Meteor.user());
		}
		createNotifications(roomCreateResult.rid, members.concat([Meteor.user().username]));
		const room = RocketChat.models.Rooms.findOneById(roomCreateResult.rid);
		if (openingQuestion) {
			const msg = openingQuestion;
			const msgObject = { _id: Random.id(), rid:roomCreateResult.rid, msg};
			RocketChat.sendMessage(Meteor.user(), msgObject, room);
		}

		const helpRequestId = RocketChat.models.HelpRequests.createForSupportArea(expertise, roomCreateResult.rid, '', environment);
		//propagate help-id to room in order to identify it as a "helped" room
		RocketChat.models.Rooms.addHelpRequestInfo(room, helpRequestId);

		return roomCreateResult;
	}
});
