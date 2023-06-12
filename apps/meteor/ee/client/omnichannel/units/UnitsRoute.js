import { useRouteParameter, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useCallback } from 'react';

import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import UnitEdit from './UnitEdit';
import UnitEditWithData from './UnitEditWithData';
import UnitsPage from './UnitsPage';

const UnitsRoute = () => {
	const t = useTranslation();
	const reload = useRef(() => null);

	const handleReload = useCallback(() => {
		reload.current();
	}, []);

	const canViewUnits = usePermission('manage-livechat-units');
	const isEnterprise = useHasLicenseModule('livechat-enterprise');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	if (context === 'edit' && id) {
		return <UnitEditWithData title={t('Edit_Unit')} unitId={id} reload={handleReload} />;
	}

	if (context === 'new') {
		return <UnitEdit title={t('New_Unit')} reload={handleReload} isNew={true} />;
	}

	if (!(isEnterprise && canViewUnits)) {
		return <NotAuthorizedPage />;
	}

	return <UnitsPage reload={reload} />;
};

export default UnitsRoute;
