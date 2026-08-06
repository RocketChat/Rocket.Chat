import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './CallBar.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('CallBar', () => {
	// The bar has no logic of its own, so what is worth pinning is that its actions are reachable and labelled —
	// not the class names Fuselage generated for them, which is all a snapshot of this could ever say.
	test.each(testCases)('renders %s with the actions it was given', (_storyName, Story) => {
		render(<Story />);

		expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyName, Story) => {
		jest.useRealTimers();
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
