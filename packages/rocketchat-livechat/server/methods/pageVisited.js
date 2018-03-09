Meteor.methods({
	'livechat:pageVisited'(token, room, pageInfo) {
		return RocketChat.Livechat.savePageHistory(token, room, pageInfo);
	}
});
