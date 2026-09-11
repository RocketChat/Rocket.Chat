import { composeStories, composeStory } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './UserInfo.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);
// WithUtcOffsetZero renders a live local-time clock, so its DOM is not
// snapshot-stable; its behavior is covered by the focused test below.
const snapshotCases = testCases.filter(([name]) => name !== 'WithUtcOffsetZero');
test.each(snapshotCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />);
	expect(baseElement).toMatchSnapshot();
});

test('shows Local Time for a UTC+0 user and does not leak a stray "0"', () => {
	const WithUtcOffsetZero = composeStory(stories.WithUtcOffsetZero, stories.default);
	const { container } = render(<WithUtcOffsetZero />);
	// utcOffset === 0 is a valid offset: the Local Time field must render,
	// and the `0 && …` short-circuit must not print a bare "0" text node.
	expect(screen.getByText('Local_Time')).toBeInTheDocument();
	expect(container).not.toHaveTextContent(/(?:^|\s)0(?:\s|$)/);
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
