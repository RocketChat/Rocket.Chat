Meteor.methods({
	'livechat:pageVisited' (token, pageInfo) {
		return RocketChat.models.LivechatPageVisitied.saveByToken(token, pageInfo);
	}
});
