import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './VoipActions.stories';

const testCases = Object.values(composeStories(stories)).map((story) => [story.storyName || 'Story', story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const tree = render(<Story />, { wrapper: mockAppRoot().build() });
	expect(tree.baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
