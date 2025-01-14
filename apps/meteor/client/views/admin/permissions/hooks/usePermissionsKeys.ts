import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Permissions } from '../../../../../app/models/client';

/**
 * Hook to fetch the permissions keys from localStorage, if present, or fetch them from the CachedCollection and store them in localStorage with the translations
 */
export const usePermissionsKeys = () => {
	const { t } = useTranslation();
	const [language] = useLocalStorage('userLanguage', 'en');
	const [permissionsKeyPairs, setPermissionsKeyPairs] = useLocalStorage<
		{
			_id: string;
			i18nLabel: string;
		}[]
	>(`permissionsKeys-${language || 'default'}`, []);

	return useMemo(() => {
		if (permissionsKeyPairs.length) {
			return permissionsKeyPairs;
		}
		const allPermissions = Permissions.find().fetch();
		const mappedPermissions = allPermissions.map(({ _id, settingId, group, section }) => ({
			_id,
			i18nLabel: `${group ? t(group) : ''} ${section ? t(section) : ''} ${t(settingId || _id)}`,
		}));
		setPermissionsKeyPairs(mappedPermissions);

		return mappedPermissions;
	}, [permissionsKeyPairs, setPermissionsKeyPairs, t]);
};
