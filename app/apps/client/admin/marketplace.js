import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

import { SideNav, call } from '../../../ui-utils/client';
import { t } from '../../../utils';
import { AppEvents } from '../communication';
import { Apps } from '../orchestrator';
import {
	appButtonProps,
	appStatusSpanProps,
	checkCloudLogin,
	formatPrice,
	formatPricingPlan,
	handleAPIError,
	promptSubscription,
	triggerAppPopoverMenu,
	warnStatusChange,
} from './helpers';

import './marketplace.html';


Template.marketplace.onCreated(function() {
	this.state = new ReactiveDict({
		isLoggedInCloud: true,
		apps: [], // TODO: maybe use another ReactiveDict here
		isLoading: true,
		searchText: '',
		sortedColumn: 'name',
		isAscendingOrder: true,

		// TODO: to use these fields
		page: 0,
		itemsPerPage: 0,
		wasEndReached: false,
	});

	(async () => {
		try {
			this.state.set('isLoggedInCloud', await call('cloud:checkUserLoggedIn'));
		} catch (error) {
			handleAPIError(error);
		}

		try {
			const appsFromMarketplace = await Apps.getAppsFromMarketplace();
			const installedApps = await Apps.getApps();

			const apps = appsFromMarketplace.map((app) => {
				const installedApp = installedApps.find(({ id }) => id === app.id);

				if (!installedApp) {
					return {
						...app,
						status: undefined,
						marketplaceVersion: app.version,
					};
				}

				return {
					...app,
					installed: true,
					status: installedApp.status,
					version: installedApp.version,
					marketplaceVersion: app.version,
				};
			});

			this.state.set('apps', apps);
		} catch (error) {
			handleAPIError(error);
		} finally {
			this.state.set('isLoading', false);
		}
	})();

	this.startAppWorking = (appId) => {
		const apps = this.state.get('apps');
		const app = apps.find(({ id }) => id === appId);
		app.working = true;
		this.state.set('apps', apps);
	};

	this.stopAppWorking = (appId) => {
		const apps = this.state.get('apps');
		const app = apps.find(({ id }) => id === appId);
		delete app.working;
		this.state.set('apps', apps);
	};

	this.handleAppAddedOrUpdated = async (appId) => {
		try {
			const { status, version } = await Apps.getApp(appId);
			const app = await Apps.getAppFromMarketplace(appId, version);
			const apps = [
				...this.state.get('apps').filter(({ id }) => id !== appId),
				{
					...app,
					installed: true,
					status,
					version,
					marketplaceVersion: app.version,
				},
			];
			this.state.set('apps', apps);
		} catch (error) {
			handleAPIError(error);
		}
	};

	this.handleAppRemoved = (appId) => {
		const apps = this.state.get('apps').map((app) => {
			if (app.id === appId) {
				delete app.installed;
				delete app.status;
				app.version = app.marketplaceVersion;
			}

			return app;
		});
		this.state.set('apps', apps);
	};

	this.handleAppStatusChange = ({ appId, status }) => {
		const apps = this.state.get('apps');
		const app = apps.find(({ id }) => id === appId);
		if (!app) {
			return;
		}

		app.status = status;
		this.state.set('apps', apps);
	};

	Apps.getWsListener().registerListener(AppEvents.APP_ADDED, this.handleAppAddedOrUpdated);
	Apps.getWsListener().registerListener(AppEvents.APP_UPDATED, this.handleAppAddedOrUpdated);
	Apps.getWsListener().registerListener(AppEvents.APP_REMOVED, this.handleAppRemoved);
	Apps.getWsListener().registerListener(AppEvents.APP_STATUS_CHANGE, this.handleAppStatusChange);
});

Template.marketplace.onDestroyed(function() {
	Apps.getWsListener().unregisterListener(AppEvents.APP_ADDED, this.handleAppAddedOrUpdated);
	Apps.getWsListener().unregisterListener(AppEvents.APP_UPDATED, this.handleAppAddedOrUpdated);
	Apps.getWsListener().unregisterListener(AppEvents.APP_REMOVED, this.handleAppRemoved);
	Apps.getWsListener().unregisterListener(AppEvents.APP_STATUS_CHANGE, this.handleAppStatusChange);
});

Template.marketplace.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

Template.marketplace.helpers({
	isLoggedInCloud() {
		return Template.instance().state.get('isLoggedInCloud');
	},
	isLoading() {
		return Template.instance().state.get('isLoading');
	},
	handleTableScroll() {
		const { state } = Template.instance();
		if (state.get('isLoading') || state.get('wasEndReached')) {
			return;
		}

		return ({ offsetHeight, scrollTop, scrollHeight }) => {
			const shouldGoToNextPage = offsetHeight + scrollTop >= scrollHeight - 100;
			if (shouldGoToNextPage) {
				return state.set('page', state.get('page') + 1);
			}
		};
	},
	handleTableResize() {
		const { state } = Template.instance();

		return function() {
			const $table = this.$('.table-scroll');
			state.set('itemsPerPage', Math.ceil(($table.height() / 40) + 5));
		};
	},
	handleTableSort() {
		const { state } = Template.instance();

		return (sortedColumn) => {
			state.set({
				page: 0,
				wasEndReached: false,
			});

			if (state.get('sortedColumn') === sortedColumn) {
				state.set('isAscendingOrder', !state.get('isAscendingOrder'));
				return;
			}

			state.set({
				sortedColumn,
				isAscendingOrder: true,
			});
		};
	},
	isSortingBy(column) {
		return Template.instance().state.get('sortedColumn') === column;
	},
	sortIcon(column) {
		const { state } = Template.instance();

		return column === state.get('sortedColumn') && state.get('isAscendingOrder') ? 'sort-down' : 'sort-up';
	},
	apps() {
		const { state } = Template.instance();
		const apps = state.get('apps');
		const searchText = state.get('searchText').toLocaleLowerCase();
		const sortedColumn = state.get('sortedColumn');
		const isAscendingOrder = state.get('isAscendingOrder');
		const sortingFactor = isAscendingOrder ? 1 : -1;

		return apps
			.filter(({ name }) => name.toLocaleLowerCase().includes(searchText))
			.sort(({ [sortedColumn]: a }, { [sortedColumn]: b }) => sortingFactor * String(a).localeCompare(String(b)));
	},
	purchaseTypeDisplay({ purchaseType, price }) {
		if (purchaseType === 'subscription') {
			return t('Subscription');
		}

		if (price > 0) {
			return t('Paid');
		}

		return t('Free');
	},
	priceDisplay({ purchaseType, pricingPlans, price }) {
		if (purchaseType === 'subscription') {
			if (!pricingPlans || !Array.isArray(pricingPlans) || pricingPlans.length === 0) {
				return '-';
			}

			return formatPricingPlan(pricingPlans[0]);
		}

		if (price > 0) {
			return formatPrice(price);
		}

		return '-';
	},
	appButtonProps,
	appStatusSpanProps,
});

Template.marketplace.events({
	'click .js-cloud-login'() {
		FlowRouter.go('cloud');
	},
	'submit .js-search-form'(event) {
		event.stopPropagation();
		return false;
	},
	'keyup .js-search'(event, instance) {
		instance.state.set('searchText', event.currentTarget.value);
	},
	'click .js-open'(event, instance) {
		event.stopPropagation();
		const { currentTarget } = event;
		const {
			id: appId,
			version,
			marketplaceVersion,
		} = instance.state.get('apps').find(({ id }) => id === currentTarget.dataset.id);
		FlowRouter.go('marketplace-app', { appId }, { version: version || marketplaceVersion });
	},
	async 'click .js-install'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const isLoggedInCloud = await checkCloudLogin();
		instance.state.set('isLoggedInCloud', isLoggedInCloud);
		if (!isLoggedInCloud) {
			return;
		}

		const { currentTarget: button } = event;

		const app = instance.state.get('apps').find(({ id }) => id === button.dataset.id);

		instance.startAppWorking(app.id);

		try {
			const { status } = await Apps.installApp(app.id, app.marketplaceVersion);
			warnStatusChange(app.name, status);
		} catch (error) {
			handleAPIError(error);
		} finally {
			instance.stopAppWorking(app.id);
		}
	},
	async 'click .js-update'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const isLoggedInCloud = await checkCloudLogin();
		instance.state.set('isLoggedInCloud', isLoggedInCloud);
		if (!isLoggedInCloud) {
			return;
		}

		const { currentTarget: button } = event;

		const app = instance.state.get('apps').find(({ id }) => id === button.dataset.id);

		instance.startAppWorking(app.id);

		try {
			const { status } = await Apps.updateApp(app.id, app.marketplaceVersion);
			warnStatusChange(app.name, status);
		} catch (error) {
			handleAPIError(error);
		} finally {
			instance.stopAppWorking(app.id);
		}
	},
	async 'click .js-purchase'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const isLoggedInCloud = await checkCloudLogin();
		instance.state.set('isLoggedInCloud', isLoggedInCloud);
		if (!isLoggedInCloud) {
			return;
		}

		const { currentTarget: button } = event;
		const app = instance.state.get('apps').find(({ id }) => id === button.dataset.id);

		instance.startAppWorking(app.id);

		await promptSubscription(app, async () => {
			try {
				const { status } = await Apps.installApp(app.id, app.marketplaceVersion);
				warnStatusChange(app.name, status);
			} catch (error) {
				handleAPIError(error);
			} finally {
				instance.stopAppWorking(app.id);
			}
		}, instance.stopAppWorking.bind(instance, app.id));
	},
	'click .js-menu'(event, instance) {
		event.stopPropagation();
		const { currentTarget } = event;

		const app = instance.state.get('apps').find(({ id }) => id === currentTarget.dataset.id);
		triggerAppPopoverMenu(app, currentTarget, instance);
	},
});
