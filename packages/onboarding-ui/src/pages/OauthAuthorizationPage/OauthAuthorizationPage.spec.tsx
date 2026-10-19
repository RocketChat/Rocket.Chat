import { render } from '@testing-library/react';

import OauthAuthorizationPage from './OauthAuthorizationPage';

it('renders without crashing', () => {
	const { container } = render(
		<OauthAuthorizationPage
			clientName={undefined}
			onClickAuthorizeOAuth={() => undefined}
			error={{
				message: undefined,
				onGoBack: () => undefined,
			}}
		/>,
	);

	expect(container.firstChild).not.toBeNull();
});
