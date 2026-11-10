import { slashCommands } from '../../lib/slashCommand';

slashCommands.add({
	command: 'xmpp-join',
	options: {
		description: 'Join xmpp rooms',
		params: '#channel',
	},
	providesPreview: false,
});
