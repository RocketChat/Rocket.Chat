import { usePermission } from '@rocket.chat/ui-contexts';

import OmnichannelDirectoryPage from './OmnichannelDirectoryPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const OmnichannelDirectoryRouter = () => {
	const canViewDirectory = usePermission('view-omnichannel-contact-center');

	if (!canViewDirectory) {
		return <NotAuthorizedPage />;
	}

	return <OmnichannelDirectoryPage />;
};

export default OmnichannelDirectoryRouter;
