import { render } from '@testing-library/react';

import ResetPasswordConfirmationPage from './ResetPasswordConfirmationPage';

it('renders without crashing', () => {
	const { container } = render(<ResetPasswordConfirmationPage />);

	expect(container.firstChild).not.toBeNull();
});
