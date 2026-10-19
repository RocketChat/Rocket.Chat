import { render } from '@testing-library/react';

import ResetPasswordForm from './ResetPasswordForm';

it('renders without crashing', () => {
	const { container } = render(<ResetPasswordForm onSubmit={() => undefined} validateEmail={() => undefined} />);

	expect(container.firstChild).not.toBeNull();
});
