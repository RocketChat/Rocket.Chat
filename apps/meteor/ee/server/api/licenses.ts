import type { BehaviorWithContext, Cloud, LicenseInfo } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Settings, Users } from '@rocket.chat/models';
import {
	ajv,
	isLicensesAddProps,
	isLicensesInfoProps,
	isLicensesValidateProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { notifyOnSettingChangedById } from '../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../app/settings/server';
import { API } from '../../../server/api/api';
import { hasPermissionAsync } from '../../../server/lib/authorization/hasPermission';
import { updateAuditedByUser } from '../../../server/settings/lib/auditedSettingUpdates';

const licenseLimitSchema = {
	type: 'object',
	properties: {
		value: { type: 'number' },
		max: { type: 'number' },
	},
	required: ['max'],
	additionalProperties: false,
};

const licenseInfoSchema = {
	type: 'object',
	properties: {
		license: { $ref: '#/components/schemas/ILicenseV3' },
		activeModules: {
			type: 'array',
			items: { $ref: '#/components/schemas/LicenseModule' },
		},
		externalModules: {
			type: 'array',
			items: { $ref: '#/components/schemas/ExternalModule' },
		},
		preventedActions: {
			type: 'object',
			properties: {
				activeUsers: { type: 'boolean' },
				guestUsers: { type: 'boolean' },
				roomsPerGuest: { type: 'boolean' },
				privateApps: { type: 'boolean' },
				marketplaceApps: { type: 'boolean' },
				monthlyActiveContacts: { type: 'boolean' },
			},
			required: ['activeUsers', 'guestUsers', 'roomsPerGuest', 'privateApps', 'marketplaceApps', 'monthlyActiveContacts'],
			additionalProperties: false,
		},
		limits: {
			type: 'object',
			properties: {
				activeUsers: licenseLimitSchema,
				guestUsers: licenseLimitSchema,
				roomsPerGuest: licenseLimitSchema,
				privateApps: licenseLimitSchema,
				marketplaceApps: licenseLimitSchema,
				monthlyActiveContacts: licenseLimitSchema,
			},
			additionalProperties: false,
		},
		tags: {
			type: 'array',
			items: { $ref: '#/components/schemas/ILicenseTag' },
		},
		trial: { type: 'boolean' },
		hasValidLicense: { type: 'boolean' },
		cloudSyncAnnouncement: { $ref: '#/components/schemas/ICloudSyncAnnouncement' },
	},
	required: ['activeModules', 'externalModules', 'preventedActions', 'limits', 'tags', 'trial', 'hasValidLicense'],
	additionalProperties: false,
};

const licensesInfoResponseSchema = ajv.compile<{ license: LicenseInfo; cloudSyncAnnouncement?: Cloud.ICloudSyncAnnouncement }>({
	type: 'object',
	properties: {
		license: licenseInfoSchema,
		cloudSyncAnnouncement: { $ref: '#/components/schemas/ICloudSyncAnnouncement' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['license', 'success'],
	additionalProperties: false,
});

const licensesSuccessResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const licensesValidateBadRequestResponseSchema = ajv.compile<{ error: string; reasons: BehaviorWithContext[] }>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [false] },
		error: { type: 'string' },
		reasons: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					behavior: {
						type: 'string',
						enum: ['invalidate_license', 'start_fair_policy', 'prevent_action', 'allow_action', 'prevent_installation', 'disable_modules'],
					},
					reason: { type: 'string', enum: ['limit', 'period', 'url'] },
					modules: {
						type: 'array',
						items: { $ref: '#/components/schemas/LicenseModule' },
					},
					limit: { type: 'string' },
				},
				required: ['behavior', 'reason'],
				additionalProperties: false,
			},
		},
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
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.post(
	'licenses.add',
	{
		authRequired: true,
		permissionsRequired: ['edit-privileged-setting'],
		body: isLicensesAddProps,
		response: {
			200: licensesSuccessResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
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
			username: this.user.username,
			ip: this.requestIp || '',
			useragent: this.request.headers.get('user-agent') || '',
		});

		const { modifiedCount } = await auditSettingOperation(Settings.updateValueById, 'Enterprise_License', license);
		if (modifiedCount) {
			void notifyOnSettingChangedById('Enterprise_License');
		}

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
			200: licensesSuccessResponseSchema,
			400: licensesValidateBadRequestResponseSchema,
			401: validateUnauthorizedErrorResponse,
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
