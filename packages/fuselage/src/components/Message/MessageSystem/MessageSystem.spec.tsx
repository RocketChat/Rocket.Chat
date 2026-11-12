import { composeStories } from '@storybook/react';
import { axe } from 'jest-axe';

import * as stories from './MessageSystem.stories.js';
import { render } from '../../../testing.js';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
