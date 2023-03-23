import type { ReactElement } from 'react';
import React from 'react';

import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';
import ConferencePage from './ConferencePage';

const ConferenceRoute = (): ReactElement => {
	return (
		<AuthenticationCheck guest>
			<ConferencePage />
		</AuthenticationCheck>
	);
};

export default ConferenceRoute;
