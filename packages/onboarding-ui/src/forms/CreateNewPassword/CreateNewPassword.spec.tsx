import { render } from '@testing-library/react';

import CreateNewPassword from './CreateNewPassword';

it('renders without crashing', () => {
	const { container } = render(
		<CreateNewPassword validatePasswordConfirmation={() => undefined} onSubmit={() => undefined} validatePassword={() => undefined} />,
	);

	expect(container.firstChild).not.toBeNull();
});
