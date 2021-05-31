import { slashCommands } from '../../utils';

slashCommands.add('gimme', null, {
	description: 'Slash_Gimme_Description',
	params: 'your_message_optional',
});

slashCommands.add('lennyface', null, {
	description: 'Slash_LennyFace_Description',
	params: 'your_message_optional',
});

slashCommands.add('shrug', null, {
	description: 'Slash_Shrug_Description',
	params: 'your_message_optional',
});

slashCommands.add('unflip', null, {
	description: 'Slash_TableUnflip_Description',
	params: 'your_message_optional',
});

slashCommands.add('tableflip', null, {
	description: 'Slash_Tableflip_Description',
	params: 'your_message_optional',
});
