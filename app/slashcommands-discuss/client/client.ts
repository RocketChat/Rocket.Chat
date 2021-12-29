import { slashCommand } from '../../utils/lib/slashCommand';

// tslint:disable: no-empty
// eslint-disable-next-line @typescript-eslint/no-empty-function
slashCommand.add('discuss', () => {}, {
	description: 'Create a new discussion',
	params: '[#channel] [discussion name]',
	permission: ['start-discussion-other-user', 'start-discussion'],
});
