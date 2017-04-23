Meteor.methods({
	createRequest(name, expertise='', members=[], environment) {
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
				return []; // even if there are no experts in the room, this is valid. A bot could notify lateron about this flaw
			}
		};

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createRequest' });
		}

		// if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-r')) {
		// 	throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createRequest' });
		// }

		// If an expertise has been selected, that means that a new room shall be created which addresses the
		// experts of this expertise. A new room name shall be created
		if (expertise && !name) {
			name = expertise + '-' + getNextId(expertise);
		}

		if (expertise) {
			members = getExperts(expertise);
		}

		const roomCreateResult = RocketChat.createRoom('r', name, Meteor.user() && Meteor.user().username, members, false, {expertise: expertise});

		const room = RocketChat.models.Rooms.findOneById(roomCreateResult.rid);
		const helpRequestId = RocketChat.models.HelpRequests.createForSupportArea(expertise, roomCreateResult.rid, '', environment);
		//propagate help-id to room in order to identify it as a "helped" room
		RocketChat.models.Rooms.addHelpRequestInfo(room, helpRequestId);

		return roomCreateResult;
	}
});
