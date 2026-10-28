import { usePermission } from '@rocket.chat/ui-contexts';

import CustomSoundsPage from './CustomSoundsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const CustomSoundsRoute = () => {
	const canManageCustomSounds = usePermission('manage-sounds');

	if (!canManageCustomSounds) {
		return <NotAuthorizedPage />;
	}

	return <CustomSoundsPage />;
};

export default CustomSoundsRoute;
