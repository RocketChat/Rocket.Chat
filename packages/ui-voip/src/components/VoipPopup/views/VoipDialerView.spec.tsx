import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VoipDialerView from './VoipDialerView';

const makeCall = jest.fn();
const closeDialer = jest.fn();

jest.mock('../../../hooks/useVoipAPI', () => ({
	useVoipAPI: jest.fn(() => ({ makeCall, closeDialer })),
}));

it('should look good', async () => {
	render(<VoipDialerView />, { wrapper: mockAppRoot().build() });

	expect(screen.getByText('New_Call')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /Device_settings/ })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /Call/i })).toBeDisabled();
});

it('should only enable call button if input has value (keyboard)', async () => {
	render(<VoipDialerView />, { wrapper: mockAppRoot().build() });

	expect(screen.getByRole('button', { name: /Call/i })).toBeDisabled();
	await userEvent.type(screen.getByLabelText('Phone_number'), '123');
	expect(screen.getByRole('button', { name: /Call/i })).toBeEnabled();
});

it('should only enable call button if input has value (mouse)', async () => {
	render(<VoipDialerView />, { wrapper: mockAppRoot().build() });

	expect(screen.getByRole('button', { name: /Call/i })).toBeDisabled();

	await userEvent.click(screen.getByTestId(`dial-pad-button-1`));
	await userEvent.click(screen.getByTestId(`dial-pad-button-2`));
	await userEvent.click(screen.getByTestId(`dial-pad-button-3`));
	expect(screen.getByRole('button', { name: /Call/i })).toBeEnabled();
});

it('should call methods makeCall and closeDialer when call button is clicked', async () => {
	render(<VoipDialerView />, { wrapper: mockAppRoot().build() });

	await userEvent.type(screen.getByLabelText('Phone_number'), '123');
	await userEvent.click(screen.getByTestId(`dial-pad-button-1`));
	await userEvent.click(screen.getByRole('button', { name: /Call/i }));
	expect(makeCall).toHaveBeenCalledWith('1231');
	expect(closeDialer).toHaveBeenCalled();
});
