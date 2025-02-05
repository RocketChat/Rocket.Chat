import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import CustomSoundsPage from './CustomSoundsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const CustomSoundsRoute = (): ReactElement => {
	const canManageCustomSounds = usePermission('manage-sounds');

	if (!canManageCustomSounds) {
		return <NotAuthorizedPage />;
	}

	return <CustomSoundsPage />;
};

export default CustomSoundsRoute;
