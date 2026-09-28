import { render } from '@testing-library/react';

import CreateNewPasswordPage from './CreateNewPasswordPage';

it('renders without crashing', () => {
	render(
		<CreateNewPasswordPage
			validatePassword={() => undefined}
			validatePasswordConfirmation={() => undefined}
			onSubmit={() => undefined}
			onLogin={() => undefined}
		/>,
	);
});
