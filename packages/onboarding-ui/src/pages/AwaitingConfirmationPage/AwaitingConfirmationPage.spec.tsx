import { render } from '@testing-library/react';

import AwaitingConfirmationPage from './AwaitingConfirmationPage.js';

it('renders without crashing', () => {
	const { container } = render(
		<AwaitingConfirmationPage
			currentStep={4}
			stepCount={4}
			securityCode=''
			emailAddress=''
			onResendEmailRequest={() => undefined}
			onChangeEmailRequest={() => undefined}
		/>,
	);

	expect(container).not.toBeEmptyDOMElement();
});
