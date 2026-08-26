import { slashCommands } from '../../../app/utils/client/slashCommand';

slashCommands.add({
	command: 'xmpp-join',
	options: {
		description: 'Join xmpp rooms',
		params: '#channel',
	},
	providesPreview: false,
});
