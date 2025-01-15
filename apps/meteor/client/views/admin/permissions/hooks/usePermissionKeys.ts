import { useTranslation } from 'react-i18next';
import { Permissions } from '../../../../../app/models/client';
import { useMemo } from 'react';

export const usePermissionKeys = () => {
	const { t } = useTranslation();

	return useMemo(() => {
		const allPermissions = Permissions.find().fetch();
		const mappedPermissions = allPermissions.map(({ _id, settingId, group, section }) => ({
			_id,
			i18nLabels: [group && t(group), section && t(section), settingId && t(settingId), t(_id)].filter(Boolean) as string[],
		}));

		return mappedPermissions;
	}, [t]);
};
