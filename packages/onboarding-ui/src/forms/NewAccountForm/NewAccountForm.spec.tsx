import { render } from '@testing-library/react';

import NewAccountForm from './NewAccountForm';

it('renders without crashing', () => {
	const { container } = render(
		<NewAccountForm
			validateEmail={() => undefined}
			validatePassword={() => undefined}
			validateConfirmationPassword={() => undefined}
			onSubmit={() => undefined}
		/>,
	);

	expect(container.firstChild).not.toBeNull();
});
