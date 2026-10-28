import { composeStories } from '@storybook/react-webpack5';
import { axe } from 'jest-axe';

import * as stories from './Table.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Table Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	test('renders one col per declared column', () => {
		const { Columns } = composeStories(stories);
		const { container } = render(<Columns />);

		expect(container.querySelectorAll('table > colgroup > col')).toHaveLength(4);
	});
});
