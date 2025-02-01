import { License } from '@rocket.chat/license';
import { Settings, Users } from '@rocket.chat/models';
import { isLicensesInfoProps } from '@rocket.chat/rest-typings';
import { check } from 'meteor/check';

import { API } from '../../../app/api/server/api';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { notifyOnSettingChangedById } from '../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../app/settings/server';
import { updateAuditedByUser } from '../../../server/settings/lib/auditedSettingUpdates';

API.v1.addRoute(
	'licenses.info',
	{ authRequired: true, validateParams: isLicensesInfoProps },
	{
		async get() {
			const unrestrictedAccess = await hasPermissionAsync(this.userId, 'view-privileged-setting');
			const loadCurrentValues = unrestrictedAccess && Boolean(this.queryParams.loadValues);

			const license = await License.getInfo({
				limits: unrestrictedAccess,
				license: unrestrictedAccess,
				currentValues: loadCurrentValues,
			});

			try {
				// TODO: Remove this logic after setting type object is implemented.
				const cloudSyncAnnouncement = JSON.parse(settings.get('Cloud_Sync_Announcement_Payload') ?? null);
				const canManageCloud = await hasPermissionAsync(this.userId, 'manage-cloud');
				return API.v1.success({
					license,
					...(canManageCloud && cloudSyncAnnouncement && { cloudSyncAnnouncement }),
				});
			} catch (error) {
				console.error('Unable to parse Cloud_Sync_Announcement_Payload');
			}

			return API.v1.success({
				license,
			});
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

			const auditSettingOperation = updateAuditedByUser({
				_id: this.userId,
				username: this.user.username!,
				ip: this.requestIp,
				useragent: this.request.headers.get('user-agent') || '',
			});

			(await auditSettingOperation(Settings.updateValueById, 'Enterprise_License', license)).modifiedCount &&
				void notifyOnSettingChangedById('Enterprise_License');

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
