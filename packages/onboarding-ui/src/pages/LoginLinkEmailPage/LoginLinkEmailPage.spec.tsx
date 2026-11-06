import { render } from '@testing-library/react';

import LoginLinkEmailPage from './LoginLinkEmailPage';

it('renders without crashing', () => {
	render(<LoginLinkEmailPage onResendEmailRequest={() => undefined} onChangeEmailRequest={() => undefined} />);
});
