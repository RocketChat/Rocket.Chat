import { render } from '@testing-library/react';

import ResetPasswordForm from './ResetPasswordForm';

it('renders without crashing', () => {
	render(<ResetPasswordForm onSubmit={() => undefined} validateEmail={() => undefined} />);
});
