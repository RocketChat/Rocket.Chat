import { render } from '@testing-library/react';

import OauthAuthorizationPage from './OauthAuthorizationPage';

it('renders without crashing', () => {
	render(
		<OauthAuthorizationPage
			clientName={undefined}
			onClickAuthorizeOAuth={() => undefined}
			error={{
				message: undefined,
				onGoBack: () => undefined,
			}}
		/>,
	);
});
