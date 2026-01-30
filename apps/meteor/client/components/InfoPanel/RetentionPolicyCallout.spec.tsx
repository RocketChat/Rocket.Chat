import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './RetentionPolicyCallout.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	jest.useFakeTimers();
	jest.setSystemTime(new Date(2024, 5, 1, 0, 0, 0));

	const { baseElement } = render(<Story />);
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	// We have to use real timers here because `jest-axe` is breaking otherwise
	jest.useRealTimers();
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
