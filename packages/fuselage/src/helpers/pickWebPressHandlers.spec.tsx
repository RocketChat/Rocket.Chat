import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { pickWebPressHandlers } from './pickWebPressHandlers';

it('fires onPress, without an event, on a click and on the keyboard activation', async () => {
	const onPress = jest.fn();
	render(
		<button type='button' {...pickWebPressHandlers({ onPress })}>
			Save
		</button>,
	);

	await userEvent.click(screen.getByRole('button'));
	await userEvent.keyboard('{Enter}');

	expect(onPress).toHaveBeenCalledTimes(2);
	expect(onPress).toHaveBeenCalledWith();
});

it('fires the deprecated onClick with the event, before onPress', async () => {
	const calls: string[] = [];
	const onClick = jest.fn(() => calls.push('onClick'));
	const onPress = jest.fn(() => calls.push('onPress'));
	render(
		<button type='button' {...pickWebPressHandlers({ onPress, onClick })}>
			Save
		</button>,
	);

	await userEvent.click(screen.getByRole('button'));

	expect(calls).toEqual(['onClick', 'onPress']);
	expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
});

it('fires onClick alone for a caller that has not moved to onPress', async () => {
	const onClick = jest.fn();
	render(
		<button type='button' {...pickWebPressHandlers({ onClick })}>
			Save
		</button>,
	);

	await userEvent.click(screen.getByRole('button'));

	expect(onClick).toHaveBeenCalledTimes(1);
});

it('adds no handler to a part nobody listens to', () => {
	expect(pickWebPressHandlers({})).toEqual({});
});
