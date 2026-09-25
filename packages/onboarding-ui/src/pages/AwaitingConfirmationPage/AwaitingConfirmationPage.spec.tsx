import { render } from '@testing-library/react';

import AwaitingConfirmationPage from './AwaitingConfirmationPage';

it('renders without crashing', () => {
	render(
		<AwaitingConfirmationPage
			currentStep={4}
			stepCount={4}
			securityCode=''
			emailAddress=''
			onResendEmailRequest={() => undefined}
			onChangeEmailRequest={() => undefined}
		/>,
	);
});
