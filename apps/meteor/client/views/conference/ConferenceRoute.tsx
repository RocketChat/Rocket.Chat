import type { ReactElement } from 'react';

import ConferencePage from './ConferencePage';
import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';

const ConferenceRoute = (): ReactElement => {
	return (
		<AuthenticationCheck guest>
			<ConferencePage />
		</AuthenticationCheck>
	);
};

export default ConferenceRoute;
