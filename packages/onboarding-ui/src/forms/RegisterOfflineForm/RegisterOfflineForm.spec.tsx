import { render } from '@testing-library/react';

import RegisterOfflineForm from './RegisterOfflineForm.js';

it('renders without crashing', () => {
	const { container } = render(
		<RegisterOfflineForm
			termsHref=''
			policyHref=''
			clientKey=''
			onCopySecurityCode={() => undefined}
			onBackButtonClick={() => undefined}
			onSubmit={() => undefined}
		/>,
	);

	expect(container).not.toBeEmptyDOMElement();
});
