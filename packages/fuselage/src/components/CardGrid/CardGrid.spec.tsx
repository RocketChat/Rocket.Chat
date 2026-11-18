import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import CardGrid from './CardGrid';
import * as stories from './CardGrid.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[CardGrid Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[CardGrid Props]', () => {
	it('merges className, sets the row height and forwards ref to the grid', () => {
		const ref = createRef<HTMLDivElement>();
		render(
			<CardGrid ref={ref} data-testid='grid' className='custom' minRowHeight={120}>
				<div />
			</CardGrid>,
		);

		const grid = screen.getByTestId('grid');
		expect(grid).toHaveClass('rcx-card-grid', 'custom');
		expect(grid.style.getPropertyValue('--rcx-card-grid-min-row-height')).toBe('120px');
		expect(ref.current).toBe(grid);
	});
});
