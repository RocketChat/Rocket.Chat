import { slashCommands } from '../../utils/lib/slashCommand';

// tslint:disable: no-empty
// eslint-disable-next-line @typescript-eslint/no-empty-function
slashCommands.add('discuss', () => {}, {
	description: 'Create a new discussion',
	params: '[#channel] [discussion name]',
	permission: ['start-discussion-other-user', 'start-discussion'],
});
