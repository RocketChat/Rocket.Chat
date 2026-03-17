import type {
	FacebookOAuthConfiguration,
	ISetting,
	ISettingColor,
	LoginServiceConfiguration,
	TwitterOAuthConfiguration,
	OAuthConfiguration,
} from '@rocket.chat/core-typings';
import { isSettingAction, isSettingColor } from '@rocket.chat/core-typings';
import { LoginServiceConfiguration as LoginServiceConfigurationModel, Settings } from '@rocket.chat/models';
import {
	ajv,
	isSettingsUpdatePropDefault,
	isSettingsUpdatePropsActions,
	isSettingsUpdatePropsColor,
	isSettingsPublicWithPaginationProps,
	isSettingsGetParams,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';
import type { FindOptions } from 'mongodb';
import _ from 'underscore';

import { updateAuditedByUser } from '../../../../server/settings/lib/auditedSettingUpdates';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { disableCustomScripts } from '../../../lib/server/functions/disableCustomScripts';
import { checkSettingValueBounds } from '../../../lib/server/lib/checkSettingValueBonds';
import { notifyOnSettingChanged, notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { addOAuthServiceMethod } from '../../../lib/server/methods/addOAuthService';
import { SettingsEvents, settings } from '../../../settings/server';
import { setValue } from '../../../settings/server/raw';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

async function fetchSettings(
	query: Parameters<typeof Settings.find>[0],
	sort: FindOptions<ISetting>['sort'],
	offset: FindOptions<ISetting>['skip'],
	count: FindOptions<ISetting>['limit'],
	fields: FindOptions<ISetting>['projection'],
): Promise<{ settings: ISetting[]; totalCount: number }> {
	const { cursor, totalCount } = Settings.findPaginated(query || {}, {
		sort: sort || { _id: 1 },
		skip: offset,
		limit: count,
		projection: { _id: 1, value: 1, enterprise: 1, invalidValue: 1, modules: 1, ...fields },
	});

	const [settingsList, total] = await Promise.all([cursor.toArray(), totalCount]);

	SettingsEvents.emit('fetch-settings', settingsList);
	return { settings: settingsList, totalCount: total };
}

const settingsPublicResponseSchema = ajv.compile<{ settings: ISetting[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		settings: { type: 'array', items: { type: 'object' } },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['settings', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const settingsOAuthResponseSchema = ajv.compile<{ services: Partial<LoginServiceConfiguration>[] }>({
	type: 'object',
	properties: {
		services: { type: 'array', items: { type: 'object' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['services', 'success'],
	additionalProperties: false,
});

const addCustomOAuthBodySchema = ajv.compile<{ name: string }>({
	type: 'object',
	properties: { name: { type: 'string' } },
	required: ['name'],
	additionalProperties: false,
});

const settingsListResponseSchema = ajv.compile<{ settings: ISetting[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		settings: { type: 'array', items: { type: 'object' } },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['settings', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const settingByIdGetResponseSchema = ajv.compile<Pick<ISetting, '_id' | 'value'>>({
	type: 'object',
	properties: {
		_id: { type: 'string' },
		value: {},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['_id', 'value', 'success'],
	additionalProperties: false,
});

const settingByIdPostResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const settingsUpdateBodySchema = ajv.compile<{ value?: unknown; execute?: boolean; editor?: string }>({
	type: 'object',
	properties: {
		value: {},
		execute: { type: 'boolean' },
		editor: { type: 'string' },
	},
	additionalProperties: true,
});

const serviceConfigurationsResponseSchema = ajv.compile<{ configurations: LoginServiceConfiguration[] }>({
	type: 'object',
	properties: {
		configurations: { type: 'array', items: { type: 'object' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['configurations', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'settings.public',
	{
		authRequired: false,
		query: isSettingsPublicWithPaginationProps,
		response: {
			200: settingsPublicResponseSchema,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();
		const { _id } = this.queryParams;

		const parsedQueryId = typeof _id === 'string' && _id ? { _id: { $in: _id.split(',').map((id) => id.trim()) } } : {};

		const ourQuery = {
			...query,
			...parsedQueryId,
			hidden: { $ne: true },
			public: true,
		};

		const { settings: settingsList, totalCount: total } = await fetchSettings(ourQuery, sort, offset, count, fields);

		return API.v1.success({
			settings: settingsList,
			count: settingsList.length,
			offset,
			total,
		});
	},
);

API.v1.get(
	'settings.oauth',
	{
		authRequired: false,
		response: {
			200: settingsOAuthResponseSchema,
		},
	},
	async function action() {
		const oAuthServicesEnabled = await LoginServiceConfigurationModel.find({}, { projection: { secret: 0 } }).toArray();

		return API.v1.success({
			services: oAuthServicesEnabled.map((service) => {
				if (!service) {
					return service;
				}

				if ((service as OAuthConfiguration).custom || (service.service && ['saml', 'cas', 'wordpress'].includes(service.service))) {
					return { ...service };
				}

				return {
					_id: service._id,
					name: service.service,
					clientId:
						(service as FacebookOAuthConfiguration).appId ||
						(service as OAuthConfiguration).clientId ||
						(service as TwitterOAuthConfiguration).consumerKey,
					buttonLabelText: service.buttonLabelText || '',
					buttonColor: service.buttonColor || '',
					buttonLabelColor: service.buttonLabelColor || '',
					custom: false,
				};
			}),
		});
	},
);

API.v1.post(
	'settings.addCustomOAuth',
	{
		authRequired: true,
		twoFactorRequired: true,
		body: addCustomOAuthBodySchema,
		response: {
			200: ajv.compile<void>({
				type: 'object',
				properties: { success: { type: 'boolean', enum: [true] } },
				required: ['success'],
				additionalProperties: false,
			}),
			400: ajv.compile({
				type: 'object',
				properties: { success: { type: 'boolean', enum: [false] }, error: { type: 'string' } },
				required: ['success'],
				additionalProperties: false,
			}),
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { name } = this.bodyParams;
		if (!name?.trim()) {
			throw new Meteor.Error('error-name-param-not-provided', 'The parameter "name" is required');
		}

		await addOAuthServiceMethod(this.userId, name);

		return API.v1.success();
	},
);

API.v1.get(
	'settings',
	{
		authRequired: true,
		query: isSettingsGetParams,
		response: {
			200: settingsListResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { includeDefaults } = this.queryParams;
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();

		let ourQuery: Parameters<typeof Settings.find>[0] = {
			hidden: { $ne: true },
		};

		if (!(await hasPermissionAsync(this.userId, 'view-privileged-setting'))) {
			ourQuery.public = true;
		}

		ourQuery = Object.assign({}, query, ourQuery);

		if (includeDefaults) {
			fields.packageValue = 1;
		}

		const { settings: settingsList, totalCount: total } = await fetchSettings(ourQuery, sort, offset, count, fields);

		return API.v1.success({
			settings: settingsList,
			count: settingsList.length,
			offset,
			total,
		});
	},
);

API.v1.get(
	'settings/:_id',
	{
		authRequired: true,
		permissionsRequired: {
			GET: { permissions: ['view-privileged-setting'], operation: 'hasAll' },
		},
		response: {
			200: settingByIdGetResponseSchema,
			400: ajv.compile({
				type: 'object',
				properties: { success: { type: 'boolean', enum: [false] } },
				required: ['success'],
				additionalProperties: true,
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { _id } = this.urlParams;
		const setting = await Settings.findOneNotHiddenById(_id);
		if (!setting) {
			return API.v1.failure();
		}
		return API.v1.success(_.pick(setting, '_id', 'value'));
	},
);

API.v1.post(
	'settings/:_id',
	{
		authRequired: true,
		permissionsRequired: {
			POST: { permissions: ['edit-privileged-setting'], operation: 'hasAll' },
		},
		twoFactorRequired: true,
		body: settingsUpdateBodySchema,
		response: {
			200: settingByIdPostResponseSchema,
			400: ajv.compile({
				type: 'object',
				properties: { success: { type: 'boolean', enum: [false] } },
				required: ['success'],
				additionalProperties: true,
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { _id } = this.urlParams;
		if (typeof _id !== 'string') {
			throw new Meteor.Error('error-id-param-not-provided', 'The parameter "id" is required');
		}

		if (disableCustomScripts() && /^Custom_Script_/.test(_id)) {
			return API.v1.forbidden('Custom scripts are disabled');
		}

		const setting = await Settings.findOneNotHiddenById(_id);

		if (!setting) {
			return API.v1.failure();
		}

		const { bodyParams } = this;

		if (isSettingAction(setting) && isSettingsUpdatePropsActions(bodyParams) && bodyParams.execute) {
			await Meteor.callAsync(setting.value);
			return API.v1.success();
		}

		const auditSettingOperation = updateAuditedByUser({
			_id: this.userId,
			username: this.user.username,
			ip: this.requestIp ?? '',
			useragent: this.request.headers.get('user-agent') ?? '',
		});

		if (isSettingColor(setting) && isSettingsUpdatePropsColor(bodyParams)) {
			const updateOptionsPromise = Settings.updateOptionsById<ISettingColor>(_id, { editor: bodyParams.editor });
			const updateValuePromise = auditSettingOperation(Settings.updateValueNotHiddenById, _id, bodyParams.value);

			const [updateOptionsResult, updateValueResult] = await Promise.all([updateOptionsPromise, updateValuePromise]);

			if (updateOptionsResult.modifiedCount || updateValueResult.modifiedCount) {
				await notifyOnSettingChangedById(_id);
			}

			return API.v1.success();
		}

		if (isSettingsUpdatePropDefault(bodyParams)) {
			checkSettingValueBounds(setting, bodyParams.value);

			const { matchedCount } = await auditSettingOperation(Settings.updateValueNotHiddenById, _id, bodyParams.value);

			if (!matchedCount) {
				return API.v1.failure();
			}

			const s = await Settings.findOneNotHiddenById(_id);
			if (!s) {
				return API.v1.failure();
			}

			settings.set(s);
			setValue(_id, bodyParams.value);

			await notifyOnSettingChanged(s);

			return API.v1.success();
		}

		return API.v1.failure();
	},
);

API.v1.get(
	'service.configurations',
	{
		authRequired: false,
		response: {
			200: serviceConfigurationsResponseSchema,
		},
	},
	async function action() {
		return API.v1.success({
			configurations: await LoginServiceConfigurationModel.find({}, { projection: { secret: 0 } }).toArray(),
		});
	},
);
