import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import OmnichannelDirectoryPage from './OmnichannelDirectoryPage';

const OmnichannelDirectoryRouter = () => {
	const canViewDirectory = usePermission('view-omnichannel-contact-center');

	if (!canViewDirectory) {
		return <NotAuthorizedPage />;
	}

	return <OmnichannelDirectoryPage />;
};

export default OmnichannelDirectoryRouter;
