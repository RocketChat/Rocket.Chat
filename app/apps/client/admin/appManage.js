import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { TAPi18n, TAPi18next } from 'meteor/rocketchat:tap-i18n';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

import { SideNav } from '../../../ui-utils/client';
import { isEmail } from '../../../utils';
import { Utilities } from '../../lib/misc/Utilities';
import { AppEvents } from '../communication';
import { Apps } from '../orchestrator';
import {
	appButtonProps,
	appStatusSpanProps,
	formatPrice,
	formatPricingPlan,
	handleAPIError,
	triggerAppPopoverMenu,
	promptSubscription,
	warnStatusChange,
	checkCloudLogin,
} from './helpers';

import './appManage.html';
import './appManage.css';

const attachAPIs = async (appId, state) => {
	try {
		const apis = await Apps.getAppApis(appId);
		state.set('apis', apis);
	} catch (error) {
		handleAPIError(error);
	}
};

const attachSettings = async (appId, state) => {
	try {
		const settings = await Apps.getAppSettings(appId);

		for (const setting of Object.values(settings)) {
			setting.i18nPlaceholder = setting.i18nPlaceholder || ' ';
			setting.value = setting.value !== undefined && setting.value !== null ? setting.value : setting.packageValue;
			setting.oldValue = setting.value;
			setting.hasChanged = false;
		}

		state.set('settings', settings);
	} catch (error) {
		handleAPIError(error);
	}
};

const attachBundlesApps = (bundledIn, _app) => {
	if (!bundledIn || !bundledIn.length) {
		return;
	}

	bundledIn.forEach(async (bundle, i) => {
		try {
			const apps = await Apps.getAppsOnBundle(bundle.bundleId);
			bundle.apps = apps.slice(0, 4);
		} catch (error) {
			handleAPIError(error);
		}

		bundledIn[i] = bundle;
		_app.set('bundledIn', bundledIn);
	});
};

const attachMarketplaceInformation = async (appId, version, _app) => {
	try {
		const {
			categories,
			isPurchased,
			price,
			bundledIn,
			purchaseType,
			subscriptionInfo,
			version: marketplaceVersion,
		} = await Apps.getLatestAppFromMarketplace(appId, version);

		_app.set({
			categories,
			isPurchased,
			price,
			bundledIn,
			purchaseType,
			subscriptionInfo,
			marketplaceVersion,
		});

		attachBundlesApps(bundledIn, _app);
	} catch (error) {
		if (error.xhr && error.xhr.status === 404) {
			return;
		}

		handleAPIError(error);
	}
};

const loadApp = async ({ appId, version, state, _app }) => {
	let app;
	try {
		app = await Apps.getApp(appId);
	} catch (error) {
		console.error(error);
	}

	state.set('settings', {});

	if (app) {
		state.set('isLoading', false);
		_app.clear();
		_app.set({ ...app, installed: true });

		attachAPIs(appId, state);
		attachSettings(appId, state);
		attachMarketplaceInformation(appId, version, _app);

		if (FlowRouter.current().route.getRouteName() === 'marketplace-app') {
			FlowRouter.withReplaceState(() => {
				FlowRouter.go('app-manage', { appId });
			});
			return;
		}

		return;
	}

	try {
		app = await Apps.getAppFromMarketplace(appId, version);
	} catch (error) {
		state.set('error', error);
	}

	if (app) {
		delete app.status;
		app.marketplaceVersion = app.version;
		state.set('isLoading', false);
		_app.clear();
		_app.set({ ...app, installed: false });

		attachBundlesApps(app.bundledIn, _app);

		if (FlowRouter.current().route.getRouteName() === 'app-manage') {
			FlowRouter.withReplaceState(() => {
				FlowRouter.go('marketplace-app', { appId });
			});
		}
	}
};

Template.appManage.onCreated(function() {
	this.appId = FlowRouter.getParam('appId');
	this.version = FlowRouter.getQueryParam('version');
	this.state = new ReactiveDict({
		settings: {},
		isLoading: true,
		isSaving: false,
	});
	this._app = new ReactiveDict({
		id: this.appId,
		version: this.version,
	});

	loadApp(this);

	this.__ = (key, options, lang_tag) => {
		const appKey = Utilities.getI18nKeyForApp(key, this.appId);
		return TAPi18next.exists(`project:${ appKey }`)
			? TAPi18n.__(appKey, options, lang_tag)
			: TAPi18n.__(key, options, lang_tag);
	};

	const withAppIdFilter = (f) => (maybeAppId, ...args) => {
		const appId = maybeAppId.appId || maybeAppId;
		if (appId !== this.appId) {
			return;
		}

		f.call(this, maybeAppId, ...args);
	};

	this.handleSettingUpdated = withAppIdFilter(() => {
		attachSettings(this.appId, this.state);
	});

	this.handleChange = withAppIdFilter(() => {
		loadApp(this);
	});

	this.handleRemoved = withAppIdFilter(() => FlowRouter.go('/admin/apps'));

	Apps.getWsListener().registerListener(AppEvents.APP_ADDED, this.handleChange);
	Apps.getWsListener().registerListener(AppEvents.APP_UPDATED, this.handleChange);
	Apps.getWsListener().registerListener(AppEvents.APP_REMOVED, this.handleRemoved);
	Apps.getWsListener().registerListener(AppEvents.APP_STATUS_CHANGE, this.handleChange);
	Apps.getWsListener().registerListener(AppEvents.APP_SETTING_UPDATED, this.handleSettingUpdated);
});

Template.apps.onDestroyed(function() {
	Apps.getWsListener().unregisterListener(AppEvents.APP_ADDED, this.handleChange);
	Apps.getWsListener().unregisterListener(AppEvents.APP_UPDATED, this.handleChange);
	Apps.getWsListener().unregisterListener(AppEvents.APP_REMOVED, this.handleRemoved);
	Apps.getWsListener().unregisterListener(AppEvents.APP_STATUS_CHANGE, this.handleChange);
	Apps.getWsListener().unregisterListener(AppEvents.APP_SETTING_UPDATED, this.handleSettingUpdated);
});

Template.appManage.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

Template.appManage.helpers({
	isSettingsPristine() {
		const settings = Template.instance().state.get('settings');
		return !Object.values(settings).some(({ hasChanged }) => hasChanged);
	},
	isSaving() {
		return Template.instance().state.get('isSaving');
	},
	error() {
		const error = Template.instance().state.get('error');

		return error && (
			(error.xhr && error.xhr.responseJSON && error.xhr.responseJSON.error)
			|| error.message
		);
	},
	isLoading() {
		return Template.instance().state.get('isLoading');
	},
	appButtonProps,
	appStatusSpanProps,
	priceDisplay() {
		const [purchaseType, price, pricingPlans] = [
			Template.instance()._app.get('purchaseType'),
			Template.instance()._app.get('price'),
			Template.instance()._app.get('pricingPlans'),
		];
		if (purchaseType === 'subscription') {
			if (!pricingPlans || !Array.isArray(pricingPlans) || pricingPlans.length === 0) {
				return;
			}

			return formatPricingPlan(pricingPlans[0]);
		}

		if (price > 0) {
			return formatPrice(price);
		}

		return 'Free';
	},
	isEmail,
	_(key, ...args) {
		const [i18nArgs, keyword] = [args.slice(-2), args.slice(-1)[0]];

		return Template.instance().__(key, {
			...keyword.hash,
			sprintf: i18nArgs,
		});
	},
	languages() {
		return [
			{
				key: '',
				name: 'Default',
				en: 'Default',
			},
			...Object.entries(TAPi18n.getLanguages())
				.map(([key, language]) => ({ key, ...language }))
				.sort(({ key: a }, { key: b }) => a.localeCompare(b)),
		];
	},
	selectedOption(_id, val) {
		const settings = Template.instance().state.get('settings');
		return settings[_id].value === val;
	},
	app() {
		return Template.instance()._app.all();
	},
	errors() {
		const { errors = {} } = Template.instance()._app.get('licenseValidation') || {};
		return Object.values(errors);
	},
	warnings() {
		const { warnings = {} } = Template.instance()._app.get('licenseValidation') || {};
		return Object.values(warnings);
	},
	settings() {
		return Object.values(Template.instance().state.get('settings'));
	},
	apis() {
		return Template.instance().state.get('apis');
	},
	curl(method, api) {
		const example = api.examples[method] || {};
		return Utilities.curl({
			url: Meteor.absoluteUrl.defaultOptions.rootUrl + api.computedPath,
			method,
			params: example.params,
			query: example.query,
			content: example.content,
			headers: example.headers,
		}).split('\n');
	},
	renderMethods(methods) {
		return methods.join('|').toUpperCase();
	},
	bundleAppNames(apps) {
		return apps.map((app) => app.latest.name).join(', ');
	},
	essentials() {
		return Template.instance()._app.get('essentials')?.map((interfaceName) => ({
			interfaceName,
			i18nKey: `Apps_Interface_${ interfaceName }`,
		}));
	},
});

Template.appManage.events({
	'click .js-cancel-editing-settings'(event, instance) {
		const settings = instance.state.get('settings');

		for (const setting of Object.values(settings)) {
			setting.value = setting.oldValue;
			setting.hasChanged = false;
		}

		instance.state.set('settings', settings);
	},

	async 'click .js-save-settings'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const { appId, state } = instance;

		if (state.get('isSaving')) {
			return;
		}

		state.set('isSaving', true);

		const settings = state.get('settings');

		try {
			const toSave = Object.values(settings)
				.filter(({ hasChanged }) => hasChanged);

			if (!toSave.length) {
				return;
			}

			const updated = await Apps.setAppSettings(appId, toSave);
			updated.forEach(({ id, value }) => {
				settings[id].value = value;
				settings[id].oldValue = value;
				settings[id].hasChanged = false;
			});

			state.set('settings', settings);
		} catch (error) {
			handleAPIError(error);
		} finally {
			state.set('isSaving', false);
		}
	},
	'click .js-close'() {
		if (FlowRouter.current().route.getRouteName() === 'marketplace-app') {
			FlowRouter.go('marketplace');
			return;
		}

		if (FlowRouter.current().route.getRouteName() === 'app-manage') {
			FlowRouter.go('apps');
			return;
		}

		window.history.back();
	},
	'click .js-menu'(event, instance) {
		event.stopPropagation();
		const { currentTarget } = event;

		triggerAppPopoverMenu(instance._app.all(), currentTarget, instance);
	},

	async 'click .js-install, click .js-update'(event, instance) {
		event.stopPropagation();

		if (!await checkCloudLogin()) {
			return;
		}

		const { appId, _app } = instance;

		_app.set('working', true);

		try {
			const { status } = await Apps.updateApp(appId, _app.get('marketplaceVersion'));
			warnStatusChange(_app.get('name'), status);
		} catch (error) {
			handleAPIError(error);
		} finally {
			_app.set('working', false);
		}
	},

	async 'click .js-purchase'(event, instance) {
		const { _app } = instance;

		if (!await checkCloudLogin()) {
			return;
		}

		_app.set('working', true);

		const app = _app.all();

		await promptSubscription(app, async () => {
			try {
				const { status } = await Apps.installApp(app.id, app.marketplaceVersion);
				warnStatusChange(app.name, status);
			} catch (error) {
				handleAPIError(error);
			} finally {
				_app.set('working', false);
			}
		}, () => _app.set('working', false));
	},

	'change input[type="checkbox"]'(event, instance) {
		const { id } = this;
		const { state } = instance;

		const settings = state.get('settings');
		const setting = settings[id];

		if (!setting) {
			return;
		}

		const value = event.currentTarget.checked;

		setting.value = value;
		setting.hasChanged = setting.oldValue !== setting.value;

		state.set('settings', settings);
	},

	'change .rc-select__element'(event, instance) {
		const { id } = this;
		const { state } = instance;

		const settings = state.get('settings');
		const setting = settings[id];

		if (!setting) {
			return;
		}

		const { value } = event.currentTarget;

		setting.value = value;
		setting.hasChanged = setting.oldValue !== setting.value;

		state.set('settings', settings);
	},

	'input input, input textarea, change input[type="color"]': _.throttle(function(event, instance) {
		const { type, id } = this;
		const { state } = instance;

		const settings = state.get('settings');
		const setting = settings[id];

		if (!setting) {
			return;
		}

		let value = event.currentTarget.value.trim();

		switch (type) {
			case 'int':
				value = parseInt(value);
				break;
			case 'boolean':
				value = value === '1';
				break;
			case 'code':
				value = $(`.code-mirror-box[data-editor-id="${ id }"] .CodeMirror`)[0].CodeMirror.getValue();
				break;
		}

		setting.value = value;
		setting.hasChanged = setting.oldValue !== setting.value;

		state.set('settings', settings);
	}, 500),
});
