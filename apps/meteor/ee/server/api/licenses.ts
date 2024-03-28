import { License } from '@rocket.chat/license';
import { Settings, Users } from '@rocket.chat/models';
import { isLicensesInfoProps } from '@rocket.chat/rest-typings';
import { check } from 'meteor/check';

import { API } from '../../../app/api/server/api';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { apiDeprecationLogger } from '../../../app/lib/server/lib/deprecationWarningLogger';

API.v1.addRoute(
	'licenses.get',
	{ authRequired: true, permissionsRequired: ['view-privileged-setting'] },
	{
		async get() {
			apiDeprecationLogger.endpoint(this.request.route, '7.0.0', this.response, ' Use licenses.info instead.');

			const license = License.getUnmodifiedLicenseAndModules();
			const licenses = license ? [license] : [];

			return API.v1.success({ licenses });
		},
	},
);

API.v1.addRoute(
	'licenses.info',
	{ authRequired: true, validateParams: isLicensesInfoProps },
	{
		async get() {
			const unrestrictedAccess = await hasPermissionAsync(this.userId, 'view-privileged-setting');
			const loadCurrentValues = unrestrictedAccess && Boolean(this.queryParams.loadValues);

			const license = await License.getInfo({ limits: unrestrictedAccess, license: unrestrictedAccess, currentValues: loadCurrentValues });

			return API.v1.success({ license });
		},
	},
);

API.v1.addRoute(
	'licenses.add',
	{ authRequired: true, permissionsRequired: ['edit-privileged-setting'] },
	{
		async post() {
			check(this.bodyParams, {
				license: String,
			});

			const { license } = this.bodyParams;
			if (!(await License.validateFormat(license))) {
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
			const maxActiveUsers = License.getMaxActiveUsers();
			const activeUsers = await Users.getActiveLocalUserCount();

			return API.v1.success({ maxActiveUsers: maxActiveUsers > 0 ? maxActiveUsers : null, activeUsers });
		},
	},
);

API.v1.addRoute(
	'licenses.isEnterprise',
	{ authOrAnonRequired: true },
	{
		get() {
			apiDeprecationLogger.endpoint(this.request.route, '7.0.0', this.response, ' Use licenses.info instead.');
			const isEnterpriseEdition = License.hasValidLicense();
			return API.v1.success({ isEnterprise: isEnterpriseEdition });
		},
	},
);
