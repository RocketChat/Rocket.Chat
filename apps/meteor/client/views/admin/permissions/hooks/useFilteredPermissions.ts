import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Permissions } from '../../../../../app/models/client';
import { filterPermissionKeys, mapPermissionKeys } from '../helpers/mapPermissionKeys';

export const useFilteredPermissions = ({ filter }: { filter: string }) => {
	const { t } = useTranslation();

	const permissions = useMemo(() => Permissions.find().fetch(), []);
	const debauncedFilter = useDebouncedValue(filter, 400);

	return useMemo(() => {
		const mappedPermissionKeys = mapPermissionKeys({ t, permissions });
		return filterPermissionKeys(mappedPermissionKeys, debauncedFilter);
	}, [debauncedFilter, permissions, t]);
};
