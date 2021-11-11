import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { ServiceConfiguration } from 'meteor/service-configuration';
import _ from 'underscore';

import { Settings } from '../../../models/server/raw';
import { hasPermission } from '../../../authorization/server';
import { API } from '../api';
import { SettingsEvents, settings } from '../../../settings/server';
import { setValue } from '../../../settings/server/raw';
import { ISetting, ISettingColor, isSettingAction, isSettingColor } from '../../../../definition/ISetting';


const fetchSettings = async (query: Parameters<typeof Settings.find>[0], sort: Parameters<typeof Settings.find>[1]['sort'], offset: Parameters<typeof Settings.find>[1]['skip'], count: Parameters<typeof Settings.find>[1]['limit'], fields: Parameters<typeof Settings.find>[1]['projection']): Promise<ISetting[]> => {
	const settings = await Settings.find(query, {
		sort: sort || { _id: 1 },
		skip: offset,
		limit: count,
		projection: { _id: 1, value: 1, enterprise: 1, invalidValue: 1, modules: 1, ...fields },
	}).toArray() as unknown as ISetting[];


	SettingsEvents.emit('fetch-settings', settings);
	return settings;
};

type OauthCustomConfiguration = {
	_id: string;
	clientId?: string;
	custom: unknown;
	service?: string;
	serverURL: unknown;
	tokenPath: unknown;
	identityPath: unknown;
	authorizePath: unknown;
	scope: unknown;
	loginStyle: unknown;
	tokenSentVia: unknown;
	identityTokenSentVia: unknown;
	keyField: unknown;
	usernameField: unknown;
	emailField: unknown;
	nameField: unknown;
	avatarField: unknown;
	rolesClaim: unknown;
	groupsClaim: unknown;
	mapChannels: unknown;
	channelsMap: unknown;
	channelsAdmin: unknown;
	mergeUsers: unknown;
	mergeRoles: unknown;
	accessTokenParam: unknown;
	showButton: unknown;

	appId: unknown;
	consumerKey: unknown;

	clientConfig: unknown;
	buttonLabelText: unknown;
	buttonLabelColor: unknown;
	buttonColor: unknown;
}
const isOauthCustomConfiguration = (config: any): config is OauthCustomConfiguration => Boolean(config);

// settings endpoints
API.v1.addRoute('settings.public', { authRequired: false }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		let ourQuery = {
			hidden: { $ne: true },
			public: true,
		};

		ourQuery = Object.assign({}, query, ourQuery);

		const settings = Promise.await(fetchSettings(ourQuery, sort, offset, count, fields));

		return API.v1.success({
			settings,
			count: settings.length,
			offset,
			total: Settings.find(ourQuery).count(),
		});
	},
});

API.v1.addRoute('settings.oauth', { authRequired: false }, {
	get() {
		const mountOAuthServices = (): object => {
			const oAuthServicesEnabled = ServiceConfiguration.configurations.find({}, { fields: { secret: 0 } }).fetch();

			return oAuthServicesEnabled.map((service) => {
				if (!isOauthCustomConfiguration(service)) {
					return service;
				}

				if (service.custom || (service.service && ['saml', 'cas', 'wordpress'].includes(service.service))) {
					return { ...service };
				}

				return {
					_id: service._id,
					name: service.service,
					clientId: service.appId || service.clientId || service.consumerKey,
					buttonLabelText: service.buttonLabelText || '',
					buttonColor: service.buttonColor || '',
					buttonLabelColor: service.buttonLabelColor || '',
					custom: false,
				};
			});
		};

		return API.v1.success({
			services: mountOAuthServices(),
		});
	},
});

API.v1.addRoute('settings.addCustomOAuth', { authRequired: true, twoFactorRequired: true }, {
	post() {
		if (!this.requestParams().name || !this.requestParams().name.trim()) {
			throw new Meteor.Error('error-name-param-not-provided', 'The parameter "name" is required');
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('addOAuthService', this.requestParams().name, this.userId);
		});


		return API.v1.success();
	},
});

API.v1.addRoute('settings', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		let ourQuery: Parameters<typeof Settings.find>[0] = {
			hidden: { $ne: true },
		};

		if (!hasPermission(this.userId, 'view-privileged-setting')) {
			ourQuery.public = true;
		}

		ourQuery = Object.assign({}, query, ourQuery);

		const settings = Promise.await(fetchSettings(ourQuery, sort, offset, count, fields));

		return API.v1.success({
			settings,
			count: settings.length,
			offset,
			total: Settings.find(ourQuery).count(),
		});
	},
});

API.v1.addRoute('settings/:_id', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-privileged-setting')) {
			return API.v1.unauthorized();
		}
		const setting = Promise.await(Settings.findOneNotHiddenById(this.urlParams._id));
		if (!setting) {
			return API.v1.failure();
		}
		return API.v1.success(_.pick(setting, '_id', 'value'));
	},
	post: {
		twoFactorRequired: true,
		action(this: any): void {
			if (!hasPermission(this.userId, 'edit-privileged-setting')) {
				return API.v1.unauthorized();
			}

			// allow special handling of particular setting types
			const setting = Promise.await(Settings.findOneNotHiddenById(this.urlParams._id));

			if (!setting) {
				return API.v1.failure();
			}

			if (isSettingAction(setting) && this.bodyParams && this.bodyParams.execute) {
				// execute the configured method
				Meteor.call(setting.value);
				return API.v1.success();
			}

			if (isSettingColor(setting) && this.bodyParams && this.bodyParams.editor && this.bodyParams.value) {
				Settings.updateOptionsById<ISettingColor>(this.urlParams._id, { editor: this.bodyParams.editor });
				Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value);
				return API.v1.success();
			}

			check(this.bodyParams, {
				value: Match.Any,
			});
			if (Promise.await(Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value))) {
				const s = Promise.await(Settings.findOneNotHiddenById(this.urlParams._id));
				if (!s) {
					return API.v1.failure();
				}
				settings.set(s);
				setValue(this.urlParams._id, this.bodyParams.value);
				return API.v1.success();
			}

			return API.v1.failure();
		},
	},
});

API.v1.addRoute('service.configurations', { authRequired: false }, {
	get() {
		return API.v1.success({
			configurations: ServiceConfiguration.configurations.find({}, { fields: { secret: 0 } }).fetch(),
		});
	},
});
