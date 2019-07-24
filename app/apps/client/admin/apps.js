import toastr from 'toastr';
import { ReactiveDict } from 'meteor/reactive-dict';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../settings';
import { AppEvents } from '../communication';
import { Apps } from '../orchestrator';
import { SideNav } from '../../../ui-utils/client';
import { t } from '../../../utils/client';
import { handleAPIError, triggerAppPopoverMenu } from './helpers';


Template.apps.onCreated(function() {
	this.state = new ReactiveDict({
		apps: [],
		isLoading: false,
		searchText: '',
		sortedColumn: 'name',
		isAscendingOrder: true,

		// TODO: to use these fields
		page: 0,
		itemsPerPage: 0,
		wasEndReached: false,
	});

	const loadApps = async () => {
		try {
			const apps = await Apps.getApps();
			this.state.set('apps', apps);
		} catch (error) {
			handleAPIError(error);
		}

		this.state.set('isLoading', false);
	};

	loadApps();

	this.handleAppAdded = async (appId) => {
		try {
			const app = await Apps.getApp(appId);
			this.state.set('apps', [...this.state.get('apps'), app]);
		} catch (error) {
			handleAPIError(error);
		}
	};

	this.handleAppRemoved = (appId) => {
		this.state.set('apps', this.state.get('apps').filter(({ id }) => id !== appId));
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

Template.apps.onDestroyed(function() {
	Apps.getWsListener().unregisterListener(AppEvents.APP_ADDED, this.handleAppAdded);
	Apps.getWsListener().unregisterListener(AppEvents.APP_REMOVED, this.handleAppRemoved);
	Apps.getWsListener().unregisterListener(AppEvents.APP_STATUS_CHANGE, this.handleAppStatusChange);
});

Template.apps.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

Template.apps.helpers({
	isDevelopmentModeEnabled() {
		return settings.get('Apps_Framework_Development_Mode') === true;
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
});

Template.apps.events({
	'click .js-marketplace'() {
		FlowRouter.go('marketplace');
	},
	'click .js-upload'() {
		FlowRouter.go('app-install');
	},
	'submit .js-search-form'(event) {
		event.stopPropagation();
		return false;
	},
	'input .js-search'(event, instance) {
		instance.state.set('searchText', event.currentTarget.value);
	},
	'click .js-manage'(event) {
		event.stopPropagation();
		const { id: appId, version } = event.currentTarget.dataset;
		FlowRouter.go('app-manage', { appId }, { version });
	},
	'click .js-menu'(event, instance) {
		event.stopPropagation();
		const { currentTarget } = event;

		const app = instance.state.get('apps').find(({ id }) => id === currentTarget.dataset.id);
		triggerAppPopoverMenu(app, currentTarget, instance);
	},
});
