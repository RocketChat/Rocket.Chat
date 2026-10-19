import { render } from '@testing-library/react';

import CheckYourEmailPage from './CheckYourEmailPage';

it('renders without crashing', () => {
	const { container } = render(<CheckYourEmailPage onResendEmailRequest={() => undefined} onChangeEmailRequest={() => undefined} />);

	expect(container.firstChild).not.toBeNull();
});
