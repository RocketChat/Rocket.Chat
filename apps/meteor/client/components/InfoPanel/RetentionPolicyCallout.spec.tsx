import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './RetentionPolicyCallout.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	// We have to use real timers here because `jest-axe` is breaking otherwise
	jest.useRealTimers();
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

test('exposes an accessible name on the callout', () => {
	const Story = composeStories(stories).Default;
	render(<Story />);

	expect(screen.getByRole('alert')).toHaveAttribute('aria-label');
	expect(screen.getByRole('alert')).not.toHaveAttribute('arial-label');
});
