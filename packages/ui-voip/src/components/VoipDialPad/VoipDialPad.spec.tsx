import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen } from '@testing-library/react';

import DialPad from './VoipDialPad';

describe('VoipDialPad', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.clearAllTimers();
	});

	it('should not be editable by default', () => {
		render(<DialPad value='' onChange={jest.fn()} />, { wrapper: mockAppRoot().build(), legacyRoot: true });

		expect(screen.getByLabelText('Phone_number')).toHaveAttribute('readOnly');
	});

	it('should enable input when editable', () => {
		render(<DialPad editable value='' onChange={jest.fn()} />, { wrapper: mockAppRoot().build(), legacyRoot: true });

		expect(screen.getByLabelText('Phone_number')).not.toHaveAttribute('readOnly');
	});

	it('should disable backspace button when input is empty', () => {
		render(<DialPad editable value='' onChange={jest.fn()} />, { wrapper: mockAppRoot().build(), legacyRoot: true });

		expect(screen.getByTestId('dial-paid-input-backspace')).toBeDisabled();
	});

	it('should enable backspace button when input has value', () => {
		render(<DialPad editable value='123' onChange={jest.fn()} />, { wrapper: mockAppRoot().build(), legacyRoot: true });

		expect(screen.getByTestId('dial-paid-input-backspace')).toBeEnabled();
	});

	it('should remove last character when backspace is clicked', () => {
		const fn = jest.fn();
		render(<DialPad editable value='123' onChange={fn} />, { wrapper: mockAppRoot().build(), legacyRoot: true });

		expect(screen.getByLabelText('Phone_number')).toHaveValue('123');

		screen.getByTestId('dial-paid-input-backspace').click();

		expect(fn).toHaveBeenCalledWith('12');
	});

	it('should call onChange when number is clicked', () => {
		const fn = jest.fn();
		render(<DialPad editable value='123' onChange={fn} />, { wrapper: mockAppRoot().build(), legacyRoot: true });

		['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].forEach((digit) => {
			screen.getByTestId(`dial-pad-button-${digit}`).click();
			expect(fn).toHaveBeenCalledWith(`123${digit}`, digit);
		});
	});

	xit('should call onChange with + when 0 pressed and held', () => {
		const fn = jest.fn();
		render(<DialPad editable longPress value='123' onChange={fn} />, { wrapper: mockAppRoot().build(), legacyRoot: true });

		const button = screen.getByTestId('dial-pad-button-0');

		button.click();
		expect(fn).toHaveBeenCalledWith('1230', '0');

		fireEvent.pointerDown(button);
		jest.runOnlyPendingTimers();
		fireEvent.pointerUp(button);

		expect(fn).toHaveBeenCalledWith('123+', '+');
	});
});
