import type { Cloud, LicenseInfo } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Settings, Users } from '@rocket.chat/models';
import {
	ajv,
	isLicensesAddProps,
	isLicensesInfoProps,
	isLicensesValidateProps,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import { hasPermissionAsync } from '../../../server/lib/authorization/hasPermission';
import { notifyOnSettingChangedById } from '../../../server/lib/notifyListener';
import { settings } from '../../../server/settings';
import { updateAuditedByUser } from '../../../server/settings/lib/auditedSettingUpdates';

// LicenseInfo is a large, loosely-matching shape (branded LicenseModule names, partial `limits`,
// a nested ILicenseV3) that a strict typia $ref can't validate without fighting the type, so the
// license/announcement payloads are validated as open objects (same relaxation as omnichannel config).
const licensesInfoResponseSchema = ajv.compile<{ license: LicenseInfo; cloudSyncAnnouncement?: Cloud.ICloudSyncAnnouncement }>({
	type: 'object',
	properties: {
		license: { type: 'object' },
		cloudSyncAnnouncement: { type: 'object' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['license', 'success'],
	additionalProperties: false,
});

const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const licensesValidateErrorSchema = ajv.compile<{
	success: false;
	error?: string;
	errorType?: string;
	stack?: string;
	reasons?: unknown[];
}>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [false] },
		error: { type: 'string' },
		errorType: { type: 'string' },
		stack: { type: 'string' },
		reasons: { type: 'array' },
	},
	required: ['success'],
	additionalProperties: false,
});

const licensesMaxActiveUsersResponseSchema = ajv.compile<{ maxActiveUsers: number | null; activeUsers: number }>({
	type: 'object',
	properties: {
		maxActiveUsers: { type: ['number', 'null'] },
		activeUsers: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['maxActiveUsers', 'activeUsers', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'licenses.info',
	{
		authRequired: true,
		query: isLicensesInfoProps,
		response: {
			200: licensesInfoResponseSchema,
			401: validateUnauthorizedErrorResponse,
			400: validateBadRequestErrorResponse,
		},
	},
	async function action() {
		const unrestrictedAccess = await hasPermissionAsync(this.user, 'view-privileged-setting');
		const loadCurrentValues = unrestrictedAccess && Boolean(this.queryParams.loadValues);

		const license = await License.getInfo({
			limits: unrestrictedAccess,
			license: unrestrictedAccess,
			currentValues: loadCurrentValues,
		});

		let cloudSyncAnnouncement;
		try {
			// TODO: Remove this logic after setting type object is implemented.
			cloudSyncAnnouncement = JSON.parse(settings.get('Cloud_Sync_Announcement_Payload') ?? null);
		} catch (error) {
			console.error('Unable to parse Cloud_Sync_Announcement_Payload');
		}

		const canManageCloud = await hasPermissionAsync(this.user, 'manage-cloud');
		return API.v1.success({
			license,
			...(canManageCloud && cloudSyncAnnouncement && { cloudSyncAnnouncement }),
		});
	},
);

API.v1.post(
	'licenses.add',
	{
		authRequired: true,
		permissionsRequired: ['edit-privileged-setting'],
		body: isLicensesAddProps,
		response: {
			200: successResponseSchema,
			401: validateUnauthorizedErrorResponse,
			400: validateBadRequestErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { license } = this.bodyParams;
		if (!(await License.validateFormat(license))) {
			return API.v1.failure('Invalid license');
		}

		const auditSettingOperation = updateAuditedByUser({
			_id: this.userId,
			username: this.user.username ?? '',
			ip: this.requestIp ?? '',
			useragent: this.request.headers.get('user-agent') || '',
		});

		(await auditSettingOperation(Settings.updateValueById, 'Enterprise_License', license)).modifiedCount &&
			void notifyOnSettingChangedById('Enterprise_License');

		return API.v1.success();
	},
);

API.v1.post(
	'licenses.validate',
	{
		authRequired: true,
		permissionsRequired: ['edit-privileged-setting'],
		body: isLicensesValidateProps,
		response: {
			200: successResponseSchema,
			401: validateUnauthorizedErrorResponse,
			400: licensesValidateErrorSchema,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { license } = this.bodyParams;

		const result = await License.validateLicenseForPreview(license);

		if (!result.valid) {
			return API.v1.failure({ error: 'license-invalid', reasons: result.reasons });
		}

		return API.v1.success();
	},
);

API.v1.get(
	'licenses.maxActiveUsers',
	{
		authRequired: true,
		response: {
			200: licensesMaxActiveUsersResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const maxActiveUsers = License.getMaxActiveUsers();
		const activeUsers = await Users.getActiveLocalUserCount();

		return API.v1.success({ maxActiveUsers: maxActiveUsers > 0 ? maxActiveUsers : null, activeUsers });
	},
);
