RocketChat.settings.onload('SlackBridge_Enabled', (key, value) => {
	if (value) {
		RocketChat.slashCommands.add('slackbridge-import', null, {
			description: 'Import_old_messages_from_slackbridge'
		});
	} else {
		delete RocketChat.slashCommands.commands['slackbridge-import'];
	}
});
