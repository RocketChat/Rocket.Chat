import type { ISetting, LicenseModule } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { useLicenseBase } from '../../../../hooks/useLicense';

export const useHasSettingModule = (setting?: ISetting) => {
	const { data } = useLicenseBase({
		select: (data) => ({ isEnterprise: Boolean(data?.license.license), activeModules: data?.license.activeModules }),
	});

	const isEnterprise = data?.isEnterprise ?? false;

	const hasSettingModule = useMemo(() => {
		if (!setting?.modules || setting?.modules.length === 0) {
			return false;
		}

		return setting.modules.every((module) => data?.activeModules.includes(module as LicenseModule));
	}, [data?.activeModules, setting?.modules]);

	if (!setting) {
		throw new Error('No setting provided');
	}

	return isEnterprise && hasSettingModule;
};
