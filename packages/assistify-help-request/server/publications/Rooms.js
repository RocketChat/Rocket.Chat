/**
 * Created by OliverJaegle on 10.08.2016.
 * Publish Peer-to-peer-specific enhancements to Rocket.Chat models
 *
 */
Meteor.publish('assistify:room', function({rid: roomId}) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized'));
	}

	// todo: add permission
	// if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
	// 	return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'livechat:visitorInfo'}));
	// }

	return RocketChat.models.Rooms.findOneById(roomId, {fields: {helpRequestId: 1}});
});
