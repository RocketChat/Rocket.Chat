import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './ForwardChatModal.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

jest.mock('../../../../app/ui-utils/client', () => ({
	LegacyRoomManager: {
		close: jest.fn(),
	},
}));

const appRoot = mockAppRoot().build();

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />, { wrapper: appRoot });
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: appRoot });

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
