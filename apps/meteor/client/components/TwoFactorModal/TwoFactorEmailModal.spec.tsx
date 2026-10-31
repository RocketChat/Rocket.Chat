import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TwoFactorEmailModal from './TwoFactorEmailModal';

it.each(['error-challenge-expired', 'error-challenge-not-found'])(
	'tells the user to log in again when resending with a challenge that is gone (%s)',
	async (errorType) => {
		const dispatch = jest.fn();
		const wrapper = mockAppRoot()
			.withTranslations('en', 'core', { 'Two-factor_authentication_expired': 'Login expired', 'Cloud_resend_email': 'Resend email' })
			.withEndpoint('POST', '/v1/twoFactorChallenges.sendEmailCode', () => {
				throw Object.assign(new Error(errorType), { errorType });
			})
			.withToastMessageDispatch(dispatch)
			.build();

		render(<TwoFactorEmailModal challengeId='challenge-1' onConfirm={jest.fn()} onClose={jest.fn()} />, { wrapper });

		await userEvent.click(screen.getByRole('button', { name: 'Resend email' }));

		await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'error', message: 'Login expired' }));
	},
);

it('tells the user a new code is sent at most once a minute when resending succeeds', async () => {
	const dispatch = jest.fn();
	const wrapper = mockAppRoot()
		.withTranslations('en', 'core', { 'Two-factor_email_code_requested': 'One code each minute', 'Cloud_resend_email': 'Resend email' })
		.withEndpoint('POST', '/v1/twoFactorChallenges.sendEmailCode', () => null)
		.withToastMessageDispatch(dispatch)
		.build();

	render(<TwoFactorEmailModal challengeId='challenge-1' onConfirm={jest.fn()} onClose={jest.fn()} />, { wrapper });

	await userEvent.click(screen.getByRole('button', { name: 'Resend email' }));

	await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'success', message: 'One code each minute' }));
});
