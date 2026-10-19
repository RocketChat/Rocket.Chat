import { render } from '@testing-library/react';

import CreateNewAccountPage from './CreateNewAccountPage';

it('renders without crashing', () => {
	const { container } = render(
		<CreateNewAccountPage
			validateEmail={() => undefined}
			validatePassword={() => undefined}
			validateConfirmationPassword={() => undefined}
			onSubmit={() => undefined}
			onLogin={() => undefined}
		/>,
	);

	expect(container.firstChild).not.toBeNull();
});
