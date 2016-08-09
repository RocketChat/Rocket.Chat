RocketChat.settings.onload('SlackBridge_Enabled', (key, value) => {
	if (value) {
		RocketChat.slashCommands.add('slackbridge-import', null, {
			description: TAPi18n.__('Import old messages from slackbridge')
		});
	} else {
		delete RocketChat.slashCommands.commands['slackbridge-import'];
	}
});
