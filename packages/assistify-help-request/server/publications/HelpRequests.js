/**
 * Created by OliverJaegle on 10.08.2016.
 * Publish Peer-to-peer-specific enhancements to Rocket.Chat models
 *
 */


Meteor.publish('assistify:helpRequests', function(roomId) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'assistify:helpRequests'}));
	}

	const room = RocketChat.models.Rooms.findOneById(roomId, {fields: {helpRequestId: 1}});

	//todo: re-enable authorization verification once proper authorization-objects are useable
	// const user = RocketChat.models.Users.findOne({_id: this.userId});
	// if (!RocketChat.authz.hasPermission(this.userId, 'view-r-rooms') && !(room.usernames.indexOf(user.username) > -1)) {
	// 	return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'assistify:helpRequests'}));
	// }


	if (room.helpRequestId) {
		// this.ready();
		return RocketChat.models.HelpRequests.findByRoomId(room._id, {
			fields: {
				_id: 1,
				roomId: 1,
				supportArea: 1,
				question: 1,
				environment: 1,
				resolutionStatus: 1
			}
		});
	} else {
		return this.ready();
	}
});
