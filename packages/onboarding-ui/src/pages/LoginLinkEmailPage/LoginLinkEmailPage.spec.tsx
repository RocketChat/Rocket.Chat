import { render } from '@testing-library/react';

import LoginLinkEmailPage from './LoginLinkEmailPage.js';

it('renders without crashing', () => {
	const { container } = render(<LoginLinkEmailPage onResendEmailRequest={() => undefined} onChangeEmailRequest={() => undefined} />);

	expect(container).not.toBeEmptyDOMElement();
});
