import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HTMLAttributes } from 'react';

import { clickableItem } from './clickableItem';

const Row = (props: HTMLAttributes<HTMLDivElement>) => (
	<div data-testid='row' {...props}>
		<button type='button'>inner</button>
	</div>
);

const ClickableRow = clickableItem(Row);

it.each(['{Enter}', ' '])('clicks the row when %s is pressed on it', async (key) => {
	const onClick = jest.fn();
	render(<ClickableRow onClick={onClick} />);

	screen.getByTestId('row').focus();
	await userEvent.keyboard(key);

	expect(onClick).toHaveBeenCalledTimes(1);
});

it('leaves keys pressed on an inner control to that control', async () => {
	const onClick = jest.fn();
	render(<ClickableRow onClick={onClick} />);

	screen.getByRole('button', { name: 'inner' }).focus();
	await userEvent.keyboard('{Enter}');

	// the inner button's own click bubbles once; the row does not click again
	expect(onClick).toHaveBeenCalledTimes(1);
});
