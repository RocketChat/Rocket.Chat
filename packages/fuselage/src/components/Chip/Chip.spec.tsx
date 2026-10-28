import { composeStories } from '@storybook/react-webpack5';
import { fireEvent } from '@testing-library/react';

import Chip from './Chip';
import * as stories from './Chip.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Chip Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});

	it('keeps onMouseDown and onClick on their own events', () => {
		const onClick = jest.fn();
		const onMouseDown = jest.fn();
		const { getByRole } = render(
			<Chip onClick={onClick} onMouseDown={onMouseDown}>
				Label
			</Chip>,
		);

		fireEvent.mouseDown(getByRole('button'));
		expect(onMouseDown).toHaveBeenCalledTimes(1);
		expect(onClick).not.toHaveBeenCalled();

		fireEvent.click(getByRole('button'));
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(onMouseDown).toHaveBeenCalledTimes(1);
	});

	it('is enabled when only onMouseDown is given', () => {
		const { getByRole } = render(<Chip onMouseDown={() => undefined}>Label</Chip>);

		expect(getByRole('button')).toBeEnabled();
	});
});
