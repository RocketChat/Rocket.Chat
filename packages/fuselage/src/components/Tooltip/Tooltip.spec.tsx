import { composeStories } from '@storybook/react-vite';

import * as stories from './Tooltip.stories';
import { render } from '../../testing';

const { Default, LightTooltip } = composeStories(stories);

describe('[Tooltip Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
	it('renders text content correctly', () => {
		const { container } = render(<Default />);
		expect(container.firstChild).toHaveTextContent('An example tooltip');
	});
	it('has the correct class', () => {
		const { container } = render(<Default />);
		expect(container.firstChild).toHaveClass('rcx-tooltip--dark');
	});
	describe('Light Tooltip', () => {
		it('has the correct class', () => {
			const { container } = render(<LightTooltip />);
			expect(container.firstChild).toHaveClass('rcx-tooltip--light');
		});
	});
});
