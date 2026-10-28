import { composeStories } from '@storybook/react-webpack5';
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
		const { getByRole } = render(<WithLongTitle />);
		const titleElement = getByRole('heading');

		expect(titleElement).toHaveClass('rcx-vertical-bar__title');
		expect(titleElement.parentElement).toHaveClass('rcx-vertical-bar__header-inner');
	});
});
