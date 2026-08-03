import type {
	FacebookOAuthConfiguration,
	ISetting,
	ISettingColor,
	LoginServiceConfiguration,
	TwitterOAuthConfiguration,
	OAuthConfiguration,
} from '@rocket.chat/core-typings';
import { isActionSettingWithEndpoint, isSettingAction, isSettingColor } from '@rocket.chat/core-typings';
import { LoginServiceConfiguration as LoginServiceConfigurationModel, Settings } from '@rocket.chat/models';
import {
	ajv,
	isSettingsUpdatePropDefault,
	isSettingsUpdatePropsActions,
	isSettingsUpdatePropsColor,
	isSettingsPublicWithPaginationProps,
	isSettingsGetParams,
	isSettingsBulkProps,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';
import type { FindOptions } from 'mongodb';
import _ from 'underscore';

import { settingsExamples } from './settings.examples';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { notifyOnSettingChanged, notifyOnSettingChangedById } from '../../lib/notifyListener';
import { refreshLoginServices } from '../../lib/refreshLoginServices';
import { SettingValidationError, validateSettingRules } from '../../lib/settingValidationRules';
import { disableCustomScripts } from '../../lib/shared/disableCustomScripts';
import { addOAuthServiceMethod } from '../../meteor-methods/auth/addOAuthService';
import { removeCustomOAuthSettings } from '../../meteor-methods/auth/removeOAuthService';
import { SettingsEvents, settings } from '../../settings';
import { checkSettingValueBounds } from '../../settings/checkSettingValueBonds';
import { updateAuditedByUser } from '../../settings/lib/auditedSettingUpdates';
import { saveSettingsBulk } from '../../settings/lib/saveSettingsBulk';
import { setValue } from '../../settings/raw';
import { API } from '../api';
import { getPaginationItems } from '../lib/getPaginationItems';

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
		summary: 'Get Public Settings',
		description: `List all public settings. Learn how this can be used in configuring your workspace in this <a href="https://docs.rocket.chat/docs/manage-settings-using-environmental-variables" target="_blank">guide</a>.

### Changelog
| Version      | Description |
| ---------------- | ------------|
|7.0.0            | Added the \`_id\` query parameter for filtering.|
|7.0.0            | Removed the \`query\` parameter.      |`,
		examples: settingsExamples['settings.public'],
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
		summary: 'Get OAuth Settings',
		description: `List all the <a href="https://docs.rocket.chat/docs/oauth" target="_blank"> OAuth services</a>. enabled in the workspace.
### Changelog
| Version      | Description |
| ---------------- | ------------|
|0.64.0            | Renamed field \`appId\` to \`clientId\` and added flag \`custom\` to indicate whether the OAuth service is customized and fix \`id\` inconsistence (set all cases to \`_id\`)       |
|0.63.0            | Added       |`,
		examples: settingsExamples['settings.oauth'],
		authRequired: false,
		response: {
			200: settingsOAuthResponseSchema,
		},
	},
	async function action() {
		const oAuthServicesEnabled = await LoginServiceConfigurationModel.find({}, { projection: { secret: 0 } }).toArray();
		const isPassportFlowEnabled = settings.get<boolean>('Accounts_OAuth_Use_Modern_Flow');

		return API.v1.success({
			services: oAuthServicesEnabled.map((service) => {
				if (!service) {
					return service;
				}

				//	CAUTION: Never hide sign-in with apple button from mobile app.
				if (service.service && ['apple'].includes(service.service)) {
					return { ...service, hideButtonOnMobile: false };
				}

				if (service.service && ['saml', 'cas', 'ldap'].includes(service.service)) {
					return { ...service, hideButtonOnMobile: false };
				}

				if ((service as OAuthConfiguration).custom || (service.service && service.service === 'wordpress')) {
					return { ...service, hideButtonOnMobile: isPassportFlowEnabled };
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
					hideButtonOnMobile: isPassportFlowEnabled,
				};
			}),
		});
	},
);

API.v1.post(
	'settings.addCustomOAuth',
	{
		summary: 'Add Custom OAuth',
		description: `Add a <a href=" https://docs.rocket.chat/docs/oauth#add-custom-oauth" target="_blank">custom OAuth integration</a> to your workspace.`,
		examples: settingsExamples['settings.addCustomOAuth'],
		authRequired: true,
		twoFactorRequired: true,
		permissionsRequired: {
			POST: { permissions: ['add-oauth-service'], operation: 'hasAll' },
		},
		body: addCustomOAuthBodySchema,
		response: {
			200: ajv.compile<void>({
				type: 'object',
				properties: { success: { type: 'boolean', enum: [true] } },
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
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

API.v1.post(
	'settings.removeCustomOAuth',
	{
		authRequired: true,
		twoFactorRequired: true,
		permissionsRequired: {
			POST: { permissions: ['add-oauth-service'], operation: 'hasAll' },
		},
		body: addCustomOAuthBodySchema,
		response: {
			200: ajv.compile<void>({
				type: 'object',
				properties: { success: { type: 'boolean', enum: [true] } },
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { name } = this.bodyParams;
		if (!name?.trim()) {
			throw new Meteor.Error('error-name-param-not-provided', 'The parameter "name" is required');
		}

		await removeCustomOAuthSettings(name);

		return API.v1.success();
	},
);

API.v1.post(
	'settings.refreshOAuthServices',
	{
		authRequired: true,
		twoFactorRequired: true,
		permissionsRequired: {
			POST: { permissions: ['add-oauth-service'], operation: 'hasAll' },
		},
		response: {
			200: ajv.compile<void>({
				type: 'object',
				properties: { success: { type: 'boolean', enum: [true] } },
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		await refreshLoginServices();
		return API.v1.success();
	},
);

API.v1.get(
	'settings',
	{
		summary: 'Get Private Settings',
		description: `List all private settings. Learn how this can be used in configuring your server in this <a href="https://docs.rocket.chat/docs/deployment-environment-variables" target="_blank">guide</a>.`,
		examples: settingsExamples.settings,
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

		if (!(await hasPermissionAsync(this.user, 'view-privileged-setting'))) {
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
		summary: 'Get Setting',
		description: `Get details of a setting by ID.
Permission required: \`view-privileged-setting\`
### Changelog
| Version      | Description |
| ---------------- | ------------|
|0.42.0            | Added       |`,
		examples: settingsExamples['settings/:_id'],
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
		summary: 'Update Setting',
		description: `Permission required: \`edit-privileged-setting\`

The \`_id\` of a setting is the first argument of the \`RocketChat.settings.add\` method used in \`Rocket.Chat/packages/rocketchat-lib/server/startup/settings.js\` (among other files).

For example, the following code in \`settings.js\` file:
  \`\`\`json
  this.add('Accounts_AllowAnonymousRead', false, {
    type: 'boolean',
    public: true  });
  \`\`\`
  This means that the setting labeled \`Allow anonymous read\` in the section \`Accounts\` has \`_id\` equal to \`Accounts_AllowAnonymousRead\`. The second argument is the default value (false). The third argument specifies the variable's type and whether it is public, hidden, and so on.

  To set a color, you can send:
  \`\`\`json
  { value: '<color-code>',
    editor: 'color' }
  \`\`\`

  And also to trigger a action-button, use:
  \`\`\`json
  { execute: true }
  \`\`\`
  ### Changelog
  | Version      | Description |
  | ---------------- | ------------|
  |0.65.0            | Added option to set a color and trigger an action       |
  |0.42.0            | Added       |`,
		authRequired: true,
		permissionsRequired: {
			POST: { permissions: ['edit-privileged-setting'], operation: 'hasAll' },
		},
		twoFactorRequired: true,
		body: settingsUpdateBodySchema,
		response: {
			200: settingByIdPostResponseSchema,
			400: validateBadRequestErrorResponse,
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

		if (
			isSettingAction(setting) &&
			isSettingsUpdatePropsActions(bodyParams) &&
			bodyParams.execute &&
			!isActionSettingWithEndpoint(setting.value)
		) {
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
			// TODO(next major): unify both validations into one function with a common API error response
			checkSettingValueBounds(setting, bodyParams.value);

			try {
				validateSettingRules([{ _id, value: bodyParams.value }]);
			} catch (error) {
				if (error instanceof SettingValidationError) {
					return API.v1.failure(error.message, 'error-setting-validation-failed');
				}
				throw error;
			}

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

API.v1.post(
	'settings',
	{
		summary: 'Update Settings in Bulk',
		description: `Updates multiple private workspace settings in a single request. 

Permission required: \`edit-privileged-setting\`

### Changelog
| Version      | Description |
| ---------------- | ------------|
|8.6.0            | Added       |`,
		examples: settingsExamples.settings,
		authRequired: true,
		twoFactorRequired: true,
		twoFactorOptions: { disableRememberMe: true },
		body: isSettingsBulkProps,
		response: {
			200: settingByIdPostResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		try {
			await saveSettingsBulk(this.userId, this.bodyParams.settings, {
				username: this.user.username ?? '',
				ip: this.requestIp ?? '',
				useragent: this.request.headers.get('user-agent') ?? '',
			});
		} catch (error) {
			if (error instanceof SettingValidationError) {
				return API.v1.failure(error.message, 'error-setting-validation-failed');
			}
			throw error;
		}

		return API.v1.success();
	},
);

API.v1.get(
	'service.configurations',
	{
		summary: 'Get OAuth Service Configuration',
		description: `List out all the active OAuth services configured with details.`,
		examples: settingsExamples['service.configurations'],
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
