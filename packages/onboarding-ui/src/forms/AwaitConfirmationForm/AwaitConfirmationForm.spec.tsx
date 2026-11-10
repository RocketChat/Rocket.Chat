import { render } from '@testing-library/react';

import AwaitConfirmationForm from './AwaitConfirmationForm';

it('renders without crashing', () => {
	render(
		<AwaitConfirmationForm
			currentStep={4}
			stepCount={4}
			securityCode='Funny Tortoise In The Hat'
			emailAddress='emailname@email.com'
			onResendEmailRequest={() => true}
			onChangeEmailRequest={() => true}
		/>,
	);
});
