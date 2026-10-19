import { composeStories } from '@storybook/react-webpack5';
import { fireEvent, screen } from '@testing-library/react';

import Chip from './Chip';
import * as stories from './Chip.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Chevron Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});

describe('[Chip events]', () => {
	it('calls onMouseDown on mousedown, not on a mouse click', () => {
		const onMouseDown = jest.fn();
		render(<Chip onMouseDown={onMouseDown}>Chip</Chip>);

		fireEvent.click(screen.getByRole('button'), { detail: 1 });
		expect(onMouseDown).not.toHaveBeenCalled();

		fireEvent.mouseDown(screen.getByRole('button'));
		expect(onMouseDown).toHaveBeenCalledTimes(1);
	});

	it('calls onMouseDown on keyboard activation when there is no onClick', () => {
		const onMouseDown = jest.fn();
		render(<Chip onMouseDown={onMouseDown}>Chip</Chip>);

		// Enter or Space on the focused chip
		fireEvent.click(screen.getByRole('button'), { detail: 0 });
		expect(onMouseDown).toHaveBeenCalledTimes(1);
	});

	it('calls onMouseDown and onClick each for their own event when both are passed', () => {
		const onClick = jest.fn();
		const onMouseDown = jest.fn();
		render(
			<Chip onClick={onClick} onMouseDown={onMouseDown}>
				Chip
			</Chip>,
		);

		fireEvent.mouseDown(screen.getByRole('button'));
		expect(onMouseDown).toHaveBeenCalledTimes(1);
		expect(onClick).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button'), { detail: 1 });
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(onMouseDown).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole('button'), { detail: 0 });
		expect(onClick).toHaveBeenCalledTimes(2);
		expect(onMouseDown).toHaveBeenCalledTimes(1);
	});

	it('is dismissable when only onMouseDown is passed', () => {
		const { container } = render(<Chip onMouseDown={jest.fn()}>Chip</Chip>);

		expect(screen.getByRole('button')).toBeEnabled();
		expect(container.querySelector('.rcx-icon')).not.toBeNull();
	});

	it('is disabled and shows no dismiss symbol without handlers', () => {
		const { container } = render(<Chip>Chip</Chip>);

		expect(screen.getByRole('button')).toBeDisabled();
		expect(container.querySelector('.rcx-icon')).toBeNull();
	});
});
