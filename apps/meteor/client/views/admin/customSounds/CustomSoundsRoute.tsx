import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import CustomSoundsPage from './CustomSoundsPage';

const CustomSoundsRoute = (): ReactElement => {
	const canManageCustomSounds = usePermission('manage-sounds');

	if (!canManageCustomSounds) {
		return <NotAuthorizedPage />;
	}

	return <CustomSoundsPage />;
};

export default CustomSoundsRoute;
