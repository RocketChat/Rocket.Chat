import { slashCommands } from '../../utils';

slashCommands.add('topic', null, {
	description: 'Slash_Topic_Description',
	params: 'Slash_Topic_Params',
	permission: 'edit-room',
});
