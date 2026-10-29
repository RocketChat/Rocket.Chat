import { composeStories } from '@storybook/react-webpack5';
import { axe, toHaveNoViolations } from 'jest-axe';

import * as stories from './ToggleSwitch.stories';
import { render } from '../../testing';

expect.extend(toHaveNoViolations);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[ToggleSwitch Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
