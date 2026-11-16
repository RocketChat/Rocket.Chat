import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Chip from './Chip';
import * as stories from './Chip.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Chip Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
		expect(screen.getByRole('button', { name: 'Marie Rowe' })).toBeInTheDocument();
	});

	it('keeps onMouseDown and onClick on their own events', async () => {
		const user = userEvent.setup();
		const onClick = jest.fn();
		const onMouseDown = jest.fn();
		render(
			<Chip onClick={onClick} onMouseDown={onMouseDown}>
				Label
			</Chip>,
		);

		await user.pointer({ keys: '[MouseLeft>]', target: screen.getByRole('button') });
		expect(onMouseDown).toHaveBeenCalledTimes(1);
		expect(onClick).not.toHaveBeenCalled();

		await user.pointer({ keys: '[/MouseLeft]', target: screen.getByRole('button') });
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(onMouseDown).toHaveBeenCalledTimes(1);
	});

	it('is enabled when only onMouseDown is given', () => {
		render(<Chip onMouseDown={() => undefined}>Label</Chip>);

		expect(screen.getByRole('button')).toBeEnabled();
	});
});
