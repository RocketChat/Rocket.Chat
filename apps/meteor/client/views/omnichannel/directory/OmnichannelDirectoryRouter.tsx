import { usePermission } from '@rocket.chat/ui-contexts';

import OmnichannelDirectoryPage from './OmnichannelDirectoryPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

type OmnichannelDirectoryRouterProps = {
	onClose?: () => void;
};

const OmnichannelDirectoryRouter = ({ onClose }: OmnichannelDirectoryRouterProps) => {
	const canViewDirectory = usePermission('view-omnichannel-contact-center');

	if (!canViewDirectory) {
		return <NotAuthorizedPage />;
	}

	return <OmnichannelDirectoryPage onClose={onClose} />;
};

export default OmnichannelDirectoryRouter;
