import type { ILicenseV2, ILicenseV3 } from '@rocket.chat/core-typings';
import { Settings, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';

import { API } from '../../../app/api/server/api';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { getUnmodifiedLicense, validateFormat, flatModules, getMaxActiveUsers, isEnterprise } from '../../app/license/server/license';

const isLicenseV2 = (license: ILicenseV2 | ILicenseV3): license is ILicenseV2 => 'modules' in license;

function licenseTransform(license: ILicenseV2 | ILicenseV3): ILicenseV2 | (ILicenseV3 & { modules: string[] }) {
	return {
		...license,
		modules: isLicenseV2(license) ? flatModules(license.modules) : license.grantedModules.map(({ module }) => module),
	};
}

API.v1.addRoute(
	'licenses.get',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasPermissionAsync(this.userId, 'view-privileged-setting'))) {
				return API.v1.unauthorized();
			}

			const license = getUnmodifiedLicense();
			const licenses = license ? [licenseTransform(license)] : [];

			return API.v1.success({ licenses });
		},
	},
);

API.v1.addRoute(
	'licenses.add',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, {
				license: String,
			});

			if (!(await hasPermissionAsync(this.userId, 'edit-privileged-setting'))) {
				return API.v1.unauthorized();
			}

			const { license } = this.bodyParams;
			if (!validateFormat(license)) {
				return API.v1.failure('Invalid license');
			}

			await Settings.updateValueById('Enterprise_License', license);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'licenses.maxActiveUsers',
	{ authRequired: true },
	{
		async get() {
			const maxActiveUsers = getMaxActiveUsers() || null;
			const activeUsers = await Users.getActiveLocalUserCount();

			return API.v1.success({ maxActiveUsers, activeUsers });
		},
	},
);

API.v1.addRoute(
	'licenses.isEnterprise',
	{ authOrAnonRequired: true },
	{
		get() {
			const isEnterpriseEdtion = isEnterprise();
			return API.v1.success({ isEnterprise: isEnterpriseEdtion });
		},
	},
);
