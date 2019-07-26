import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { TAPi18n, TAPi18next } from 'meteor/tap:i18n';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';
import s from 'underscore.string';

import { SideNav, modal } from '../../../ui-utils/client';
import { isEmail, APIClient } from '../../../utils';
import { AppEvents } from '../communication';
import { Utilities } from '../../lib/misc/Utilities';
import { Apps } from '../orchestrator';
import {
	createAppButtonPropsHelper,
	formatPrice,
	formatPricingPlan,
	handleAPIError,
	triggerButtonLoadingState,
	triggerAppPopoverMenu,
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

const loadApp = async (instance) => {
	const { appId, version, state } = instance;

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
		state.set({ ...app, isLoading: false });

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
	});

	loadApp(this);

	this.__ = (key, options, lang_tag) => {
		const appKey = Utilities.getI18nKeyForApp(key, this.appId);
		return TAPi18next.exists(`project:${ appKey }`) ? TAPi18n.__(appKey, options, lang_tag) : TAPi18n.__(key, options, lang_tag);
	};

	const withAppIdFilter = (f) => function(maybeAppId, ...args) {
		const appId = maybeAppId.appId || maybeAppId;
		if (appId !== this.appId) {
			return;
		}

		f.call(this, maybeAppId, ...args);
	};

	this.handleStatusChanged = withAppIdFilter(({ status }) => {
		this.state.set('status', status);
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
	appButtonProps: createAppButtonPropsHelper(
		'rc-apps-section__button--inactive',
		'rc-apps-section__button--failed'
	),
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
		const options = args.pop().hash;
		if (!_.isEmpty(args)) {
			options.sprintf = args;
		}

		return Template.instance().__(key, options);
	},
	languages() {
		const languages = TAPi18n.getLanguages();

		let result = Object.keys(languages).map((key) => {
			const language = languages[key];
			return _.extend(language, { key });
		});

		result = _.sortBy(result, 'key');
		result.unshift({
			name: 'Default',
			en: 'Default',
			key: '',
		});
		return result;
	},
	selectedOption(_id, val) {
		const settings = Template.instance().state.get('settings');
		return settings[_id].value === val;
	},
	app() {
		return Template.instance().state.all();
	},
	categories() {
		return Template.instance().state.get('categories');
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

	'click .js-save-settings': async (e, t) => {
		if (t.state.get('isSaving')) {
			return;
		}
		t.state.set('isSaving', true);
		const settings = t.state.get('settings');


		try {
			const toSave = [];
			Object.keys(settings).forEach((k) => {
				const setting = settings[k];
				if (setting.hasChanged) {
					toSave.push(setting);
				}
			});

			if (toSave.length === 0) {
				throw new Error('Nothing to save..');
			}
			const updated = await Apps.setAppSettings(t.id.get(), toSave);
			updated.forEach(({ id, value }) => {
				settings[id].value = value;
				settings[id].oldValue = value;
			});
			Object.values(settings).forEach((setting) => {
				setting.hasChanged = false;
			});
			t.state.set('settings', settings);
		} catch (e) {
			console.log(e);
		} finally {
			t.state.set('isSaving', false);
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

	async 'click .js-install'(event, instance) {
		event.stopPropagation();

		const { id, state } = instance;

		state.set('working', true);

		try {
			await Apps.installApp(id, state.get('marketplaceVersion'));
		} catch (error) {
			handleAPIError(error);
		} finally {
			state.set('working', false);
		}
	},

	async 'click .js-purchase'(event, instance) {
		const { id, purchaseType = 'buy', version } = instance.state.all();
		const { currentTarget: button } = event;
		const stopLoading = triggerButtonLoadingState(button);

		let data = null;
		try {
			data = await APIClient.get(`apps?buildExternalUrl=true&appId=${ id }&purchaseType=${ purchaseType }`);
		} catch (e) {
			handleAPIError(e, instance);
			stopLoading();
			return;
		}

		modal.open({
			allowOutsideClick: false,
			data,
			template: 'iframeModal',
		}, async () => {
			try {
				await APIClient.post('apps/', {
					appId: id,
					marketplace: true,
					version,
				});
			} catch (e) {
				handleAPIError(e, instance);
			}

			try {
				await loadApp(instance);
			} catch (e) {
				handleAPIError(e, instance);
			} finally {
				stopLoading();
			}
		}, stopLoading);
	},

	'change input[type="checkbox"]': (e, t) => {
		const labelFor = $(e.currentTarget).attr('name');
		const isChecked = $(e.currentTarget).prop('checked');

		// $(`input[name="${ labelFor }"]`).prop('checked', !isChecked);

		const setting = t.state.get('settings')[labelFor];

		if (setting) {
			setting.value = isChecked;
			t.state.get('settings')[labelFor].hasChanged = setting.oldValue !== setting.value;
			t.state.set('settings', t.state.get('settings'));
		}
	},

	'change .rc-select__element': (e, t) => {
		const labelFor = $(e.currentTarget).attr('name');
		const value = $(e.currentTarget).val();

		const setting = t.state.get('settings')[labelFor];

		if (setting) {
			setting.value = value;
			t.state.get('settings')[labelFor].hasChanged = setting.oldValue !== setting.value;
			t.state.set('settings', t.state.get('settings'));
		}
	},

	'input input, input textarea, change input[type="color"]': _.throttle(function(e, t) {
		let value = s.trim($(e.target).val());

		switch (this.type) {
			case 'int':
				value = parseInt(value);
				break;
			case 'boolean':
				value = value === '1';
				break;
			case 'code':
				value = $(`.code-mirror-box[data-editor-id="${ this.id }"] .CodeMirror`)[0].CodeMirror.getValue();
		}

		const setting = t.state.get('settings')[this.id];

		if (setting) {
			setting.value = value;

			if (setting.oldValue !== setting.value) {
				t.state.get('settings')[this.id].hasChanged = true;
				t.state.set('settings', t.state.get('settings'));
			}
		}
	}, 500),
});
