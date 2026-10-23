import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './RoomMembers.stories';
import { expectListKeyboard, expectListSemantics, listWrapper } from '../../../../../tests/mocks/utils/listContract';
import { useUserInfoActions } from '../../hooks/useUserInfoActions';

jest.mock('../../hooks/useUserInfoActions', () => ({
	useUserInfoActions: jest.fn(),
}));

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	// Disable 'nested-interactive' rule because our `Select` component is still not a11y compliant
	const results = await axe(container, { rules: { 'nested-interactive': { enabled: false } } });
	expect(results).toHaveNoViolations();
});

it('follows the semantics and keyboard model of a composite list', async () => {
	jest.mocked(useUserInfoActions).mockReturnValue({
		menuActions: [{ id: 'actions', items: [{ id: 'remove', content: 'Remove' }] }],
	} as unknown as ReturnType<typeof useUserInfoActions>);
	const { Default } = composeStories(stories);
	const [member] = Default.args.members ?? [];
	render(<Default members={[member, { ...member, _id: 'rocket.dog', username: 'rocket.dog', name: 'Rocket.Dog' }]} />, {
		wrapper: listWrapper(),
	});

	const list = await expectListSemantics('Members');
	await expectListKeyboard(list);
});
