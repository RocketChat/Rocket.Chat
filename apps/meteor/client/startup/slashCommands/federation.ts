import { slashCommands } from '../../../app/utils/client/slashCommand';

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
