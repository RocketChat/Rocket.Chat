import { slashCommands } from '../../lib/slashCommand';

const callback = undefined;
const result = undefined;
const providesPreview = false;
const previewer = undefined;
const previewCallback = undefined;

slashCommands.add({
	command: 'federation',
	callback,
	options: {
		description: 'Federation_slash_commands',
		params: '#command (dm) #user',
	},
	result,
	providesPreview,
	previewer,
	previewCallback,
});

slashCommands.add({
	command: 'xmpp-join',
	options: {
		description: 'Join xmpp rooms',
		params: '#channel',
	},
	providesPreview: false,
});
