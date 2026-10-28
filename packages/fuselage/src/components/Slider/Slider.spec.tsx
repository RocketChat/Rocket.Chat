import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Slider from './Slider';
import * as stories from './Slider.stories';
import { render } from '../../testing';

const { Default, WithLabel, MultiThumb, WithDefaultValue } = composeStories(stories);

describe('[Slider Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});

	it('should display the label when passed', () => {
		render(<WithLabel />);
		const label = screen.queryByText('Range');
		expect(label).toBeInTheDocument();
		expect(label?.textContent).toBe('Range');
	});

	it('should output the defaultValue when passed', () => {
		render(<WithDefaultValue />);
		const output = screen.queryByTestId('slider-output');
		expect(output?.textContent).toBe('25');
	});

	it('should have two thumbs when multiThumb prop is true', () => {
		render(<MultiThumb />);
		const thumbs = screen.queryAllByRole('slider');
		expect(thumbs.length).toBe(2);
	});

	it("should update Thumb's position when Thumb is clicked and dragged", async () => {
		render(<Default />);

		const slider = screen.getByRole<HTMLFormElement>('slider');

		await userEvent.tab();
		await userEvent.keyboard('{ArrowRight}');
		await userEvent.keyboard('{ArrowRight}');
		await userEvent.keyboard('{ArrowRight}');
		await userEvent.keyboard('{ArrowRight}');

		expect(slider.value).toBe('4');
	});
});

describe('[Slider root props]', () => {
	it('merges className and style on the root', () => {
		render(<Slider aria-label='Volume' className='custom' style={{ opacity: 0.5 }} />);

		const root = screen.getByRole('group');
		expect(root).toHaveClass('rcx-slider', 'custom');
		expect(root).toHaveStyle({ opacity: '0.5' });
	});
});
