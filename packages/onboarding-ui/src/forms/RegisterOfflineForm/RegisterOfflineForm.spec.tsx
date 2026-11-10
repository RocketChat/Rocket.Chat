import { render } from '@testing-library/react';

import RegisterOfflineForm from './RegisterOfflineForm';

it('renders without crashing', () => {
	render(
		<RegisterOfflineForm
			termsHref=''
			policyHref=''
			clientKey=''
			onCopySecurityCode={() => undefined}
			onBackButtonClick={() => undefined}
			onSubmit={() => undefined}
		/>,
	);
});
