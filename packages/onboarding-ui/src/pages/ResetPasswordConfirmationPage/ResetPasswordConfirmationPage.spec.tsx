import { render } from '@testing-library/react';

import ResetPasswordConfirmationPage from './ResetPasswordConfirmationPage.js';

it('renders without crashing', () => {
	const { container } = render(<ResetPasswordConfirmationPage />);

	expect(container).not.toBeEmptyDOMElement();
});
