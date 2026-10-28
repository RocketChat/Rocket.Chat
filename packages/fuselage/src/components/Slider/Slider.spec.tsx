import { composeStories } from '@storybook/react-vite';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
