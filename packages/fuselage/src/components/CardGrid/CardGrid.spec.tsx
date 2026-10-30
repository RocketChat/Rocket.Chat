import { composeStories } from '@storybook/react-webpack5';
import { axe } from 'jest-axe';

import * as stories from './CardGrid.stories';
import CardGrid from './CardGrid';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[CardGrid Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	test('renders one GridItem for each real child', () => {
		const { container } = render(
			<CardGrid>
				<div>First card</div>
				{null}
				{undefined}
				{false}
				<div>Second card</div>
				{true}
			</CardGrid>,
		);

		expect(container.querySelectorAll('.rcx-card-grid__item')).toHaveLength(2);
	});
});

