import { render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

jest.mock('react-i18next', () => ({
	useTranslation: jest.fn(),
}));

jest.mock(
	'@rocket.chat/ui-client',
	() => ({
		GenericModal: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	}),
	{ virtual: true },
);

jest.mock('./TwoFactorModal', () => ({
	Method: {
		TOTP: 'totp',
	},
}));

import TwoFactorTotpModal from './TwoFactorTotpModal';

describe('TwoFactorTotpModal', () => {
	it('renders the TOTP input with one-time-code autofill hints', () => {
		jest.mocked(useTranslation).mockReturnValue({
			t: (key: string) => key,
			i18n: {} as never,
		});

		render(<TwoFactorTotpModal onConfirm={jest.fn()} onClose={jest.fn()} />);

		const input = screen.getByRole('textbox', { name: 'Enter_the_code_provided_by_your_authentication_app_to_continue' });

		expect(input).toHaveAttribute('autocomplete', 'one-time-code');
		expect(input).toHaveAttribute('inputmode', 'numeric');
		expect(input).toHaveAttribute('name', 'totp');
	});
});
