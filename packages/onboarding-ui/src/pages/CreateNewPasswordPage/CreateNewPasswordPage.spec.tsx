import { render } from '@testing-library/react';

import CreateNewPasswordPage from './CreateNewPasswordPage';

it('renders without crashing', () => {
	const { container } = render(
		<CreateNewPasswordPage
			validatePassword={() => undefined}
			validatePasswordConfirmation={() => undefined}
			onSubmit={() => undefined}
			onLogin={() => undefined}
		/>,
	);

	expect(container.firstChild).not.toBeNull();
});
