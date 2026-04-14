import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './InviteUsers.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

beforeEach(() => {
	jest.mock('react', () => ({
		...jest.requireActual('react'),
		useId: () => 1,
	}));
});

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const view = render(<Story />);
	expect(view.baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	/**
	 ** Disable 'nested-interactive' rule because our `Select` component is still not a11y compliant
	 **/
	const results = await axe(container, { rules: { 'nested-interactive': { enabled: false } } });
	expect(results).toHaveNoViolations();
});
