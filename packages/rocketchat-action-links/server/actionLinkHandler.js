//Action Links Handler. This method will be called off the client.

Meteor.methods({
	actionLinkHandler(fuctIndex, msgObj, userIdCalled) {
		var rcDataBaseObj = RocketChat.models.Messages.findOne({ _id: msgObj._id });
		// console.log(rcDataBaseObj);

		if (!msgObj) {
			console.log('returned not msgObj');
			return;
		}
		if (!userIdCalled) {
			console.log('returned not called user');
			return;
		}
		if (!rcDataBaseObj) {
			console.log('returned not rcDataBaseObj');
			return;
		}
		if (!rcDataBaseObj.actionLinks) {
			console.log('returned not actionLinks');
			return;
		}

		var roomCalled = RocketChat.models.Rooms.findOne({_id: rcDataBaseObj.rid});
		// console.log('room: ', roomCalled);

		//Get user who called method
		var userCalled = RocketChat.models.Users.findOneById(userIdCalled,
			{ fields: { _id: 1, username: 1} });

		// console.log('user called: ', userCalled);

		//Get all users in room
		var usersInRoom = roomCalled.usernames;
		if (usersInRoom.indexOf(userCalled.username) === -1) {
			console.log('returned userCalled not in room');
			return;
		}

		//Make sure fuctIndex exists
		var calledActionLink = rcDataBaseObj.actionLinks[fuctIndex];
		// console.log('calledActionLink  ', calledActionLink);
		if (!calledActionLink) {
			console.log('returned calledActionLink doesn\'t exist');
			return;
		}

		// console.log(calledActionLink.method_id, RocketChat.actionLinks);
		if (!RocketChat.actionLinks[calledActionLink.method_id]) {
			console.log('returned no actionLink function exists');
			return;
		}
		//Call the function
		RocketChat.actionLinks[calledActionLink.method_id](rcDataBaseObj, calledActionLink.params);

	}
});