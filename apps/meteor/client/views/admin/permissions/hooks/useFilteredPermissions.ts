import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Permissions } from '../../../../../app/models/client';
import { filterPermissionKeys, mapPermissionKeys } from '../helpers/mapPermissionKeys';

export const useFilteredPermissions = ({ filter }: { filter: string }) => {
	const { t } = useTranslation();

	return useMemo(() => {
		const permissions = Permissions.find().fetch();
		const mappedPermissionKeys = mapPermissionKeys({ t, permissions });
		return filterPermissionKeys(mappedPermissionKeys, filter);
	}, [filter, t]);
};
