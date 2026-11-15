import { render } from '@testing-library/react';

import CreateNewPassword from './CreateNewPassword';

it('renders without crashing', () => {
	render(
		<CreateNewPassword validatePasswordConfirmation={() => undefined} onSubmit={() => undefined} validatePassword={() => undefined} />,
	);
});
