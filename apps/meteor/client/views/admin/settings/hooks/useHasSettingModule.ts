import type { ISetting, LicenseModule } from '@rocket.chat/core-typings';
import { useLicenseBase } from '@rocket.chat/ui-client';

export const useHasSettingModule = (setting?: ISetting) => {
	const { data } = useLicenseBase({
		select: (data) => ({ isEnterprise: Boolean(data?.license.license), activeModules: data?.license.activeModules }),
	});

	const isEnterprise = data?.isEnterprise ?? false;

	const hasSettingModule =
		!!setting?.modules?.length && setting.modules.every((module) => data?.activeModules.includes(module as LicenseModule));

	if (!setting) {
		throw new Error('No setting provided');
	}

	return isEnterprise && hasSettingModule;
};
