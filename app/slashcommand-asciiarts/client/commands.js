import { slashCommands } from '../../utils/client';
import { Gimme } from '../lib/gimme';
import { LennyFace } from '../lib/lenny';
import { Shrug } from '../lib/shrug';
import { Tableflip } from '../lib/tableflip';
import { Unflip } from '../lib/unflip';

slashCommands.add('gimme', Gimme, {
	description: 'Slash_Gimme_Description',
	params: 'your_message_optional',
});


slashCommands.add('lennyface', LennyFace, {
	description: 'Slash_LennyFace_Description',
	params: 'your_message_optional',
});

slashCommands.add('shrug', Shrug, {
	description: 'Slash_Shrug_Description',
	params: 'your_message_optional',
});

slashCommands.add('tableflip', Tableflip, {
	description: 'Slash_Tableflip_Description',
	params: 'your_message_optional',
});

slashCommands.add('unflip', Unflip, {
	description: 'Slash_TableUnflip_Description',
	params: 'your_message_optional',
});
