import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import TwoFactorTOTP from './TwoFactorTOTP';
import { createFakeUser } from '../../../../tests/mocks/data';

const translations = { You_have_n_codes_remaining: 'You have {{number}} codes remaining' };

it('should show the remaining backup codes when TOTP is enabled', async () => {
	const getCodesRemaining = jest.fn(() => ({ remaining: 7 }));

	render(<TwoFactorTOTP />, {
		wrapper: mockAppRoot()
			.withUser(createFakeUser({ services: { totp: { enabled: true, hashedBackup: [], secret: 'secret' } } }))
			.withTranslations('en', 'core', translations)
			.withEndpoint('GET', '/v1/users.totpCodesRemaining', getCodesRemaining)
			.build(),
	});

	expect(await screen.findByText('You have 7 codes remaining')).toBeInTheDocument();
});

it('should not request the remaining codes when TOTP is disabled', () => {
	const getCodesRemaining = jest.fn(() => ({ remaining: 7 }));

	render(<TwoFactorTOTP />, {
		wrapper: mockAppRoot()
			.withUser(createFakeUser())
			.withTranslations('en', 'core', translations)
			.withEndpoint('GET', '/v1/users.totpCodesRemaining', getCodesRemaining)
			.build(),
	});

	expect(getCodesRemaining).not.toHaveBeenCalled();
});
