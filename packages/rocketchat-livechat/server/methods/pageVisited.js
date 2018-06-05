Meteor.methods({
	'livechat:pageVisited'(token, room, pageInfo) {
		RocketChat.Livechat.savePageHistory(token, room, pageInfo);
	}
});
