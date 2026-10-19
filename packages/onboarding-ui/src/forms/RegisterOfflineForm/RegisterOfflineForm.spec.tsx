import { render } from '@testing-library/react';

import RegisterOfflineForm from './RegisterOfflineForm';

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

	expect(container.firstChild).not.toBeNull();
});
