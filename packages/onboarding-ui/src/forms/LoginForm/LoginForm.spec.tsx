import { render } from '@testing-library/react';

import LoginForm from './LoginForm';

it('renders without crashing', () => {
	render(<LoginForm onChangeForm={() => undefined} isPasswordLess={false} onResetPassword={() => undefined} onSubmit={() => undefined} />);
});
