Meteor.methods({
	resumeBot(bot) {
		check(bot, Object);

		Meteor.call('sendClientCommand', bot, 'resumeSubscriptions');
		return RocketChat.models.Bots.updateBotStatusById(bot._id, false);
	}
});
