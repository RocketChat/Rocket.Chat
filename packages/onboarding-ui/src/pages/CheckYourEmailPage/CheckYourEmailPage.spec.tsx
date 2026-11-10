import { render } from '@testing-library/react';

import CheckYourEmailPage from './CheckYourEmailPage';

it('renders without crashing', () => {
	render(<CheckYourEmailPage onResendEmailRequest={() => undefined} onChangeEmailRequest={() => undefined} />);
});
