import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';

import * as stories from './Tooltip.stories';
import { render } from '../../testing';

const { Default, LightTooltip } = composeStories(stories);

describe('[Tooltip Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);

		expect(screen.getByText('An example tooltip')).toHaveClass('rcx-tooltip');
	});
	it('renders text content correctly', () => {
		render(<Default />);
		expect(screen.getByText('An example tooltip')).toBeInTheDocument();
	});
	it('has the correct class', () => {
		render(<Default />);
		expect(screen.getByText('An example tooltip')).toHaveClass('rcx-tooltip--dark');
	});
	describe('Light Tooltip', () => {
		it('has the correct class', () => {
			render(<LightTooltip />);
			expect(screen.getByText('An example tooltip')).toHaveClass('rcx-tooltip--light');
		});
	});
});
