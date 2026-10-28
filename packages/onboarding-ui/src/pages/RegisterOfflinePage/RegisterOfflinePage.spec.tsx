import { render } from '@testing-library/react';

import RegisterOfflinePage from '.';

it('renders without crashing', () => {
	render(
		<RegisterOfflinePage
			termsHref=''
			policyHref=''
			clientKey=''
			onSubmit={() => undefined}
			onCopySecurityCode={() => undefined}
			onBackButtonClick={() => undefined}
		/>,
	);
});
