import { useSetting, useUser } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import React from 'react';

import TwoFactorEmail from './TwoFactorEmail';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUser: jest.fn(),
	useTranslation: jest.fn(() => (t: string) => t),
	useSetting: jest.fn(),
}));

jest.mock('../../../hooks/useEndpointAction', () => ({
	useEndpointAction: jest.fn(),
}));

describe('TwoFactorEmail Component', () => {
	it('should render the component without crashing', () => {
		render(<TwoFactorEmail />, { legacyRoot: true });
		expect(screen.getByText('Enable_two-factor_authentication_email')).toBeInTheDocument();
	});

	it('should render the Email two factor button', () => {
		(useSetting as jest.Mock).mockReturnValue(true);
		(useUser as jest.Mock).mockReturnValue({ isOAuthUser: true });

		render(<TwoFactorEmail />, { legacyRoot: true });
		expect(screen.getByText('Enable_two-factor_authentication_email')).toBeInTheDocument();
	});

	it('should render nothing, no button for OAuth user if setting is false', () => {
		(useSetting as jest.Mock).mockReturnValue(false);
		(useUser as jest.Mock).mockReturnValue({ isOAuthUser: true });

		const { container } = render(<TwoFactorEmail />, { legacyRoot: true });
		expect(container).toBeEmptyDOMElement();
	});

	it('should render button, if user not OAuth user', () => {
		(useUser as jest.Mock).mockReturnValue({ isOAuthUser: false });

		render(<TwoFactorEmail />, { legacyRoot: true });
		expect(screen.getByText('Enable_two-factor_authentication_email')).toBeInTheDocument();
	});
});
