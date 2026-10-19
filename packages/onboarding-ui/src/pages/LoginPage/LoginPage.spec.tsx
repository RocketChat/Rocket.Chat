import { render } from '@testing-library/react';

import LoginPage from './LoginPage';

it('renders without crashing', () => {
	const { container } = render(
		<LoginPage
			isMfa={false}
			initialValues={undefined}
			onChangeForm={() => undefined}
			onResetPassword={() => undefined}
			onSubmit={() => undefined}
			isPasswordLess={false}
			onCreateAccount={() => undefined}
		/>,
	);

	expect(container.firstChild).not.toBeNull();
});
