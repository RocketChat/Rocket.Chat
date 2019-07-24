import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import semver from 'semver';
import toastr from 'toastr';

import { t } from '../../../utils';
import { AppEvents } from '../communication';
import { Apps } from '../orchestrator';
import { SideNav } from '../../../ui-utils/client';
import {
	formatPrice,
	formatPricingPlan,
	handleAPIError,
	promptMarketplaceLogin,
	promptSubscription,
	triggerAppPopoverMenu,
	triggerButtonLoadingState,
} from './helpers';

import './marketplace.html';
import './marketplace.css';


Template.marketplace.onCreated(function() {
	this.state = new ReactiveDict({
		isLoggedInCloud: true,
		apps: [],
		isLoading: true,
		searchText: '',
		sortedColumn: 'name',
		isAscendingOrder: true,

		// TODO: to use these fields
		page: 0,
		itemsPerPage: 0,
		wasEndReached: false,
	});

	Meteor.call('cloud:checkUserLoggedIn', (error, isLoggedInCloud) => {
		if (error) {
			console.warn(error);
			return;
		}

		this.state.set('isLoggedInCloud', isLoggedInCloud);
	});

	(async () => {
		try {
			const appsFromMarketplace = await Apps.getAppsFromMarketplace();
			const installedApps = await Apps.getApps();

			const apps = appsFromMarketplace.map((app) => {
				const installedApp = installedApps.find(({ id }) => id === app.id) || {};

				return {
					...app,
					status: installedApp.status,
					version: installedApp.version,
					marketplaceStatus: app.status,
					marketplaceVersion: app.version,
				};
			});

			this.state.set('apps', apps);
		} catch (error) {
			handleAPIError(error);
		}

		this.state.set('isLoading', false);
	})();

	this.handleAppAdded = async (appId) => {
		try {
			const apps = this.state.get('apps');
			const installedApp = await Apps.getApp(appId);
			const app = apps.find(({ id }) => id === installedApp.id);
			[app.status, app.version] = [installedApp.status, installedApp.version];
			this.state.set('apps', apps);
		} catch (error) {
			handleAPIError(error);
		}
	};

	this.handleAppRemoved = (appId) => {
		const apps = this.state.get('apps').map((app) => {
			if (app.id === appId) {
				delete app.status;
				delete app.version;
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
		toastr.info(t(`App_status_${ status }`), app.name);
	};

	Apps.getWsListener().registerListener(AppEvents.APP_ADDED, this.handleAppAdded);
	Apps.getWsListener().registerListener(AppEvents.APP_REMOVED, this.handleAppRemoved);
	Apps.getWsListener().registerListener(AppEvents.APP_STATUS_CHANGE, this.handleAppStatusChange);
});

Template.marketplace.onDestroyed(function() {
	Apps.getWsListener().unregisterListener(AppEvents.APP_ADDED, this.handleAppAdded);
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
	isInstalled({ status }) {
		return typeof status !== 'undefined';
	},
	isOnTrialPeriod({ subscriptionInfo }) {
		return subscriptionInfo.status === 'trialing';
	},
	canUpdate({ version, marketplaceVersion }) {
		return version && semver.lt(version, marketplaceVersion);
	},
	canDownload({ isPurchased, isSubscribed }) {
		return isPurchased || isSubscribed;
	},
	canTrial({ purchaseType, subscriptionInfo }) {
		return purchaseType === 'subscription' && !subscriptionInfo.status;
	},
	canBuy({ price }) {
		return price > 0;
	},
});

Template.marketplace.events({
	'click .js-cloud-login'() {
		FlowRouter.go('cloud-config');
	},
	'submit .js-search-form'(event) {
		event.preventDefault();
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
		FlowRouter.go('app-manage', { appId }, { version: version || marketplaceVersion });
	},
	async 'click .js-install'(event, instance) {
		event.stopPropagation();

		const { currentTarget: button } = event;
		const stopLoading = triggerButtonLoadingState(button);

		const app = instance.state.get('apps').find(({ id }) => id === button.dataset.id);

		try {
			await Apps.installApp(app.id, app.marketplaceVersion);
		} catch (error) {
			handleAPIError(error);
		} finally {
			stopLoading();
		}
	},
	async 'click .js-purchase'(event, instance) {
		event.stopPropagation();

		if (!instance.state.get('isLoggedInCloud')) {
			promptMarketplaceLogin();
			return;
		}

		const { currentTarget: button } = event;
		const stopLoading = triggerButtonLoadingState(button);

		const app = instance.state.get('apps').find(({ id }) => id === button.dataset.id);

		await promptSubscription(app, async () => {
			try {
				await Apps.installApp(app.id, app.marketplaceVersion);
			} catch (error) {
				handleAPIError(error);
			} finally {
				stopLoading();
			}
		}, stopLoading);
	},
	'click .js-menu'(event, instance) {
		event.stopPropagation();
		const { currentTarget } = event;

		const app = instance.state.get('apps').find(({ id }) => id === currentTarget.dataset.id);
		triggerAppPopoverMenu(app, currentTarget, instance);
	},
});
