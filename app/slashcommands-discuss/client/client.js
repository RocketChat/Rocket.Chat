import { slashCommands } from '../../utils';

slashCommands.add('discuss', null, {
	description: 'Create a new discussion',
	params: '[#channel] [discussion name]',
	permission: ['start-discussion-other-user', 'start-discussion'],
});
