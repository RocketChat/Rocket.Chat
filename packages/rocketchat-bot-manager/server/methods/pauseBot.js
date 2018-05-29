Meteor.methods({
	pauseBot(bot) {
		check(bot, Object);

		Meteor.call('sendClientCommand', bot, 'pauseSubscriptions');
		return RocketChat.models.Bots.updateBotStatusById(bot._id, true);
	}
});
