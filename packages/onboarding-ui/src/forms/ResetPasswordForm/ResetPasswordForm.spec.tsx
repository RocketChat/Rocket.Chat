import { render } from '@testing-library/react';

import ResetPasswordForm from './ResetPasswordForm.js';

it('renders without crashing', () => {
	const { container } = render(<ResetPasswordForm onSubmit={() => undefined} validateEmail={() => undefined} />);

	expect(container).not.toBeEmptyDOMElement();
});
