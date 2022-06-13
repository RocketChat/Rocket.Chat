import { slashCommands } from '../../../utils/lib/slashCommand';

const callback = undefined;
const result = undefined;
const providesPreview = false;
const previewer = undefined;
const previewCallback = undefined;

slashCommands.add(
	'federation',
	callback,
	{
		description: 'Federation_slash_commands',
		params: '#command (dm) #user',
	},
	result,
	providesPreview,
	previewer,
	previewCallback,
);
