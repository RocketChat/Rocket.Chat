import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import CustomSoundsPage from './CustomSoundsPage';

const CustomSoundsRoute = () => {
	const canManageCustomSounds = usePermission('manage-sounds');

	if (!canManageCustomSounds) {
		return <NotAuthorizedPage />;
	}

	return <CustomSoundsPage />;
};

export default CustomSoundsRoute;
