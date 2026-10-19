import { render } from '@testing-library/react';

import ResetPasswordPage from './ResetPasswordPage';

it('renders without crashing', () => {
	const { container } = render(<ResetPasswordPage validateEmail={() => undefined} onSubmit={() => undefined} onLogin={() => undefined} />);

	expect(container.firstChild).not.toBeNull();
});
