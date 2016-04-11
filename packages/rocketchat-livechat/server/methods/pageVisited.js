Meteor.methods({
	'livechat:pageVisited' (token, pageInfo) {
		return RocketChat.models.LivechatPageVisited.saveByToken(token, pageInfo);
	}
});
