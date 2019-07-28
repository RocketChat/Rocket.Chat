import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { TAPi18n, TAPi18next } from 'meteor/tap:i18n';
import { Tracker } from 'meteor/tracker';
import toastr from 'toastr';
import _ from 'underscore';

import { SideNav } from '../../../ui-utils/client';
import { isEmail, t } from '../../../utils';
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

const attachBundlesApps = (bundledIn, state) => {
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
		state.set('bundledIn', bundledIn);
	});
};

const attachMarketplaceInformation = async (appId, version, state) => {
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

		state.set({
			categories,
			isPurchased,
			price,
			bundledIn,
			purchaseType,
			subscriptionInfo,
			marketplaceVersion,
		});

		attachBundlesApps(bundledIn, state);
	} catch (error) {
		handleAPIError(error);
	}
};

const loadApp = async ({ appId, version, state }) => {
	let app;
	try {
		app = await Apps.getApp(appId);
	} catch (error) {
		console.error(error);
	}

	if (app) {
		state.set({ ...app, installed: true, isLoading: false });

		attachAPIs(appId, state);
		attachSettings(appId, state);
		attachMarketplaceInformation(appId, version, state);

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
		state.set({ ...app, installed: false, isLoading: false });

		attachBundlesApps(app.bundledIn, state);
	}
};

Template.appManage.onCreated(function() {
	this.appId = FlowRouter.getParam('appId');
	this.version = FlowRouter.getQueryParam('version');
	this.state = new ReactiveDict({
		id: this.appId,
		version: this.version,
		settings: {},
		isLoading: true,
		isSaving: false,
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

	this.handleStatusChanged = withAppIdFilter(({ status }) => {
		this.state.set('status', status);
		toastr.info(t(`App_status_${ status }`), this.state.get('name'));
	});

	this.handleSettingUpdated = withAppIdFilter(() => {
		attachSettings(this.appId, this.state);
	});

	this.handleAppAdded = withAppIdFilter(() => {
		loadApp(this);
	});

	this.handleAppRemoved = withAppIdFilter(() => {
		loadApp(this);
	});

	Apps.getWsListener().registerListener(AppEvents.APP_ADDED, this.handleAppAdded);
	Apps.getWsListener().registerListener(AppEvents.APP_REMOVED, this.handleAppRemoved);
	Apps.getWsListener().registerListener(AppEvents.APP_STATUS_CHANGE, this.handleStatusChanged);
	Apps.getWsListener().registerListener(AppEvents.APP_SETTING_UPDATED, this.handleSettingUpdated);
});

Template.apps.onDestroyed(function() {
	Apps.getWsListener().unregisterListener(AppEvents.APP_ADDED, this.handleAppAdded);
	Apps.getWsListener().unregisterListener(AppEvents.APP_REMOVED, this.handleAppRemoved);
	Apps.getWsListener().unregisterListener(AppEvents.APP_STATUS_CHANGE, this.handleStatusChanged);
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
			Template.instance().state.get('purchaseType'),
			Template.instance().state.get('price'),
			Template.instance().state.get('pricingPlans'),
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
		return Template.instance().state.all();
	},
	errors() {
		const { errors } = Template.instance().state.get('licenseValidation');
		return Object.values(errors);
	},
	warnings() {
		const { warnings } = Template.instance().state.get('licenseValidation');
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

		const { id, state } = instance;

		if (state.get('isSaving')) {
			return;
		}

		state.set('isSaving', true);

		const settings = state.get('settings');

		try {
			const toSave = Object.entries(settings)
				.filter(({ hasChanged }) => hasChanged);

			if (!toSave.length) {
				return;
			}

			const updated = await Apps.setAppSettings(id, toSave);
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
		window.history.back();
	},
	'click .js-menu'(event, instance) {
		event.stopPropagation();
		const { currentTarget } = event;

		triggerAppPopoverMenu(instance.state.all(), currentTarget, instance);
	},

	async 'click .js-install, click .js-update'(event, instance) {
		event.stopPropagation();

		const { appId, state } = instance;

		state.set('working', true);

		try {
			await Apps.installApp(appId, state.get('marketplaceVersion'));
		} catch (error) {
			handleAPIError(error);
		} finally {
			state.set('working', false);
		}
	},

	async 'click .js-purchase'(event, instance) {
		const { state } = instance;

		state.set('working', true);

		const app = state.all();

		await promptSubscription(app, async () => {
			try {
				await Apps.installApp(app.id, app.marketplaceVersion);
			} catch (error) {
				handleAPIError(error);
			} finally {
				state.set('working', false);
			}
		}, () => state.set('working', false));
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
