/* eslint-disable no-await-in-loop */
import { installPointerEvent, triggerLongPress } from '@react-spectrum/test-utils';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DialPad from './VoipDialPad';

const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

installPointerEvent();

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.clearAllTimers();
});

it('should not be editable by default', async () => {
	render(<DialPad value='' onChange={jest.fn()} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByLabelText('Phone_number')).toHaveAttribute('readOnly');
});

it('should enable input when editable', async () => {
	render(<DialPad editable value='' onChange={jest.fn()} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByLabelText('Phone_number')).not.toHaveAttribute('readOnly');
});

it('should disable backspace button when input is empty', async () => {
	render(<DialPad editable value='' onChange={jest.fn()} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByTestId('dial-paid-input-backspace')).toBeDisabled();
});

it('should enable backspace button when input has value', async () => {
	render(<DialPad editable value='123' onChange={jest.fn()} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByTestId('dial-paid-input-backspace')).toBeEnabled();
});

it('should remove last character when backspace is clicked', async () => {
	const fn = jest.fn();
	render(<DialPad editable value='123' onChange={fn} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByLabelText('Phone_number')).toHaveValue('123');

	await user.click(screen.getByTestId('dial-paid-input-backspace'));

	expect(fn).toHaveBeenCalledWith('12');
});

it('should call onChange when number is clicked', async () => {
	const fn = jest.fn();
	render(<DialPad editable value='123' onChange={fn} />, { wrapper: mockAppRoot().build() });

	for (const digit of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) {
		await user.click(screen.getByTestId(`dial-pad-button-${digit}`));
		expect(fn).toHaveBeenCalledWith(`123${digit}`, digit);
	}
});

it('should call onChange with + when 0 pressed and held', async () => {
	const fn = jest.fn();
	render(<DialPad editable longPress value='123' onChange={fn} />, { wrapper: mockAppRoot().build() });

	const button = screen.getByTestId('dial-pad-button-0');

	await user.click(button);

	expect(fn).toHaveBeenCalledWith('1230', '0');

	await triggerLongPress({ element: button, advanceTimer: (time = 800) => jest.advanceTimersByTime(time) });

	expect(fn).toHaveBeenCalledWith('123+', '+');
});
