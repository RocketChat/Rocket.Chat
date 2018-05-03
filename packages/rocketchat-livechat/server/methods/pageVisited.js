Meteor.methods({
	'livechat:pageVisited'(token, pageInfo) {
		return RocketChat.Livechat.savePageHistory(token, pageInfo);
	}
});
