import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import OmnichannelDirectoryPage from './OmnichannelDirectoryPage';

const OmnichannelDirectoryRouter = () => {
	const canViewDirectory = usePermission('view-omnichannel-contact-center');

	if (!canViewDirectory) {
		return <NotAuthorizedPage />;
	}

	return <OmnichannelDirectoryPage />;
};

export default OmnichannelDirectoryRouter;
