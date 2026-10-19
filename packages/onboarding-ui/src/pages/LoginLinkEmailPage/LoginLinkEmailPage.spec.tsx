import { render } from '@testing-library/react';

import LoginLinkEmailPage from './LoginLinkEmailPage';

it('renders without crashing', () => {
	const { container } = render(<LoginLinkEmailPage onResendEmailRequest={() => undefined} onChangeEmailRequest={() => undefined} />);

	expect(container.firstChild).not.toBeNull();
});
