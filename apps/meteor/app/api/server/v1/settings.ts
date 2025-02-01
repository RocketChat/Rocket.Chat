import type {
	FacebookOAuthConfiguration,
	ISetting,
	ISettingColor,
	TwitterOAuthConfiguration,
	OAuthConfiguration,
} from '@rocket.chat/core-typings';
import { isSettingAction, isSettingColor } from '@rocket.chat/core-typings';
import { LoginServiceConfiguration as LoginServiceConfigurationModel, Settings } from '@rocket.chat/models';
import {
	isSettingsUpdatePropDefault,
	isSettingsUpdatePropsActions,
	isSettingsUpdatePropsColor,
	isSettingsPublicWithPaginationProps,
	isSettingsGetParams,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';
import type { FindOptions } from 'mongodb';
import _ from 'underscore';

import { updateAuditedByUser } from '../../../../server/settings/lib/auditedSettingUpdates';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { disableCustomScripts } from '../../../lib/server/functions/disableCustomScripts';
import { notifyOnSettingChanged, notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { SettingsEvents, settings } from '../../../settings/server';
import { setValue } from '../../../settings/server/raw';
import { API } from '../api';
import type { ResultFor } from '../definition';
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

	const [settings, total] = await Promise.all([cursor.toArray(), totalCount]);

	SettingsEvents.emit('fetch-settings', settings);
	return { settings, totalCount: total };
}

// settings endpoints
API.v1.addRoute(
	'settings.public',
	{ authRequired: false, validateParams: isSettingsPublicWithPaginationProps },
	{
		async get() {
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

			const { settings, totalCount: total } = await fetchSettings(ourQuery, sort, offset, count, fields);

			return API.v1.success({
				settings,
				count: settings.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'settings.oauth',
	{ authRequired: false },
	{
		async get() {
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
	},
);

API.v1.addRoute(
	'settings.addCustomOAuth',
	{ authRequired: true, twoFactorRequired: true },
	{
		async post() {
			if (!this.bodyParams.name?.trim()) {
				throw new Meteor.Error('error-name-param-not-provided', 'The parameter "name" is required');
			}

			await Meteor.callAsync('addOAuthService', this.bodyParams.name, this.userId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'settings',
	{ authRequired: true, validateParams: isSettingsGetParams },
	{
		async get() {
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

			// Note: change this when `fields` gets removed
			if (includeDefaults) {
				fields.packageValue = 1;
			}

			const { settings, totalCount: total } = await fetchSettings(ourQuery, sort, offset, count, fields);

			return API.v1.success({
				settings,
				count: settings.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'settings/:_id',
	{
		authRequired: true,
		permissionsRequired: {
			GET: { permissions: ['view-privileged-setting'], operation: 'hasAll' },
			POST: { permissions: ['edit-privileged-setting'], operation: 'hasAll' },
		},
	},
	{
		async get() {
			const setting = await Settings.findOneNotHiddenById(this.urlParams._id);
			if (!setting) {
				return API.v1.failure();
			}
			return API.v1.success(_.pick(setting, '_id', 'value'));
		},
		post: {
			twoFactorRequired: true,
			async action(): Promise<ResultFor<'POST', '/v1/settings/:_id'>> {
				if (typeof this.urlParams._id !== 'string') {
					throw new Meteor.Error('error-id-param-not-provided', 'The parameter "id" is required');
				}

				// Disable custom scripts in cloud trials to prevent phishing campaigns
				if (disableCustomScripts() && /^Custom_Script_/.test(this.urlParams._id)) {
					return API.v1.forbidden();
				}

				// allow special handling of particular setting types
				const setting = await Settings.findOneNotHiddenById(this.urlParams._id);

				if (!setting) {
					return API.v1.failure();
				}

				if (isSettingAction(setting) && isSettingsUpdatePropsActions(this.bodyParams) && this.bodyParams.execute) {
					// execute the configured method
					await Meteor.callAsync(setting.value);
					return API.v1.success();
				}

				const auditSettingOperation = updateAuditedByUser({
					_id: this.userId,
					username: this.user.username!,
					ip: this.requestIp,
					useragent: this.request.headers.get('user-agent') || '',
				});

				if (isSettingColor(setting) && isSettingsUpdatePropsColor(this.bodyParams)) {
					const updateOptionsPromise = Settings.updateOptionsById<ISettingColor>(this.urlParams._id, { editor: this.bodyParams.editor });
					const updateValuePromise = auditSettingOperation(Settings.updateValueNotHiddenById, this.urlParams._id, this.bodyParams.value);

					const [updateOptionsResult, updateValueResult] = await Promise.all([updateOptionsPromise, updateValuePromise]);

					if (updateOptionsResult.modifiedCount || updateValueResult.modifiedCount) {
						await notifyOnSettingChangedById(this.urlParams._id);
					}

					return API.v1.success();
				}

				if (isSettingsUpdatePropDefault(this.bodyParams)) {
					const { matchedCount } = await auditSettingOperation(
						Settings.updateValueNotHiddenById,
						this.urlParams._id,
						this.bodyParams.value,
					);

					if (!matchedCount) {
						return API.v1.failure();
					}

					const s = await Settings.findOneNotHiddenById(this.urlParams._id);
					if (!s) {
						return API.v1.failure();
					}

					settings.set(s);
					setValue(this.urlParams._id, this.bodyParams.value);

					await notifyOnSettingChanged(s);

					return API.v1.success();
				}

				return API.v1.failure();
			},
		},
	},
);

API.v1.addRoute(
	'service.configurations',
	{ authRequired: false },
	{
		async get() {
			return API.v1.success({
				configurations: await LoginServiceConfigurationModel.find({}, { projection: { secret: 0 } }).toArray(),
			});
		},
	},
);
