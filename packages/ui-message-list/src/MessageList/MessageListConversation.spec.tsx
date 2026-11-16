import { composeStories } from '@storybook/react';
import { act, render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './MessageListConversation.stories';

it('has the room, the thread, selection mode, hidden avatars, a read-only place and read receipts (R76)', () => {
	expect(Object.keys(composeStories(stories))).toEqual(
		expect.arrayContaining(['Room', 'Thread', 'SelectionMode', 'HiddenAvatars', 'ReadOnly', 'WithReadReceipts']),
	);
});

jest.mock('./MessageListVirtualizer', () => jest.requireActual('./MessageListRows'));

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('%s should have no accessibility violations (R75, R76)', async (_storyName, Story) => {
	const { container } = render(<Story />);

	await act(async () => undefined);

	expect(await axe(container)).toHaveNoViolations();
});
