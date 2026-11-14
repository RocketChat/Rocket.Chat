import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import * as stories from './Contextualbar.stories';
import { render } from '../../testing';

expect.extend(toHaveNoViolations);

const { WithLongTitle } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Contextualbar Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	test('WithLongTitle should truncate long titles', () => {
		render(<WithLongTitle />);
		const titleElement = screen.getByRole('heading');

		expect(titleElement).toHaveClass('rcx-vertical-bar__title');
		// oxlint-disable-next-line testing-library/no-node-access -- the header wrapper has no role, label or text of its own
		expect(titleElement.parentElement).toHaveClass('rcx-vertical-bar__header-inner');
	});
});
