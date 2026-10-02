import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './UserInfo.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);
test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />);
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

test('shows the local time of a UTC+0 user without printing a stray "0"', () => {
	const { Default } = composeStories(stories);
	const { container } = render(<Default utcOffset={0} />);

	expect(screen.getByText('Local_Time')).toBeInTheDocument();
	expect(screen.getByText(/\(UTC 0\)/)).toBeInTheDocument();
	expect(container).not.toHaveTextContent(/(?:^|\s)0(?:\s|$)/);
});
