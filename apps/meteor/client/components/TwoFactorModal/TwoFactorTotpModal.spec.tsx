import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TwoFactorTotpModal from './TwoFactorTotpModal';

describe('TwoFactorTotpModal', () => {
	const dispatchToastMessage = jest.fn();
	const wrapper = mockAppRoot().withToastMessageDispatch(dispatchToastMessage).build();

	beforeEach(() => jest.clearAllMocks());

	it('should show an invalid-code error and allow another attempt', async () => {
		const user = userEvent.setup();
		const onConfirm = jest.fn().mockRejectedValueOnce({ error: 'totp-invalid' }).mockResolvedValue(undefined);
		render(<TwoFactorTotpModal onConfirm={onConfirm} onClose={jest.fn()} />, { wrapper });

		await user.type(screen.getByRole('textbox'), '123456');
		await user.click(screen.getByRole('button', { name: 'Verify' }));

		expect(await screen.findByText('Invalid_two_factor_code')).toBeInTheDocument();
		expect(screen.getByRole('textbox')).toHaveValue('');
		expect(dispatchToastMessage).not.toHaveBeenCalled();

		await user.type(screen.getByRole('textbox'), '654321');
		await user.click(screen.getByRole('button', { name: 'Verify' }));

		await waitFor(() => expect(onConfirm).toHaveBeenLastCalledWith('654321', 'totp'));
		expect(screen.queryByText('Invalid_two_factor_code')).not.toBeInTheDocument();
	});

	it.each([
		{ error: 403, reason: 'No matching login attempt found' },
		{ error: 'totp-max-attempts', reason: 'TOTP Maximun Failed Attempts Reached' },
		new Error('Network unavailable'),
	])('should report a non-code failure without labeling the code invalid: %s', async (error) => {
		const user = userEvent.setup();
		render(<TwoFactorTotpModal onConfirm={jest.fn().mockRejectedValue(error)} onClose={jest.fn()} />, { wrapper });

		await user.type(screen.getByRole('textbox'), '123456');
		await user.click(screen.getByRole('button', { name: 'Verify' }));

		await waitFor(() => expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: error }));
		expect(screen.queryByText('Invalid_two_factor_code')).not.toBeInTheDocument();
	});
});
