import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Permissions } from '../../../../../app/models/client';
import { filterPermissionKeys, mapPermissionKeys } from '../helpers/mapPermissionKeys';

export const useFilteredPermissions = ({ filter }: { filter: string }) => {
	const { t } = useTranslation();

	const mappedPermissionKeys = useMemo(() => {
		const permissions = Permissions.find().fetch();
		return mapPermissionKeys({ t, permissions });
	}, [t]);

	const debouncedFilter = useDebouncedValue(filter, 400);

	return useMemo(() => {
		return filterPermissionKeys(mappedPermissionKeys, debouncedFilter);
	}, [debouncedFilter, mappedPermissionKeys]);
};
