import toastr from 'toastr';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { settings } from '../../../settings';
import { t, APIClient } from '../../../utils';
import { AppEvents } from '../communication';
import { Apps } from '../orchestrator';
import { SideNav } from '../../../ui-utils/client';

const ENABLED_STATUS = ['auto_enabled', 'manually_enabled'];
const enabled = ({ status }) => ENABLED_STATUS.includes(status);

const sortByColumn = (array, column, inverted) =>
	array.sort((a, b) => {
		if (a.latest[column] < b.latest[column] && !inverted) {
			return -1;
		}
		return 1;
	});

const getInstalledApps = async (instance) => {
	try {
		const data = await APIClient.get('apps');
		const apps = data.apps.map((app) => ({ latest: app }));

		instance.apps.set(apps);
	} catch (e) {
		toastr.error((e.xhr.responseJSON && e.xhr.responseJSON.error) || e.message);
	}

	instance.isLoading.set(false);
	instance.ready.set(true);
};

Template.apps.onCreated(function() {
	const instance = this;
	this.ready = new ReactiveVar(false);
	this.apps = new ReactiveVar([]);
	this.categories = new ReactiveVar([]);
	this.searchText = new ReactiveVar('');
	this.searchSortBy = new ReactiveVar('name');
	this.sortDirection = new ReactiveVar('asc');
	this.limit = new ReactiveVar(0);
	this.page = new ReactiveVar(0);
	this.end = new ReactiveVar(false);
	this.isLoading = new ReactiveVar(true);

	getInstalledApps(instance);

	try {
		APIClient.get('apps?categories=true').then((data) => instance.categories.set(data));
	} catch (e) {
		toastr.error((e.xhr.responseJSON && e.xhr.responseJSON.error) || e.message);
	}

	instance.onAppAdded = function _appOnAppAdded() {
		// ToDo: fix this formatting data to add an app to installedApps array without to fetch all

		// fetch(`${ HOST }/v1/apps/${ appId }`).then((result) => {
		// 	const installedApps = instance.installedApps.get();

		// 	installedApps.push({
		// 		latest: result.app,
		// 	});
		// 	instance.installedApps.set(installedApps);
		// });
	};

	instance.onAppRemoved = function _appOnAppRemoved(appId) {
		const apps = instance.apps.get();

		let index = -1;
		apps.find((item, i) => {
			if (item.id === appId) {
				index = i;
				return true;
			}
			return false;
		});

		apps.splice(index, 1);
		instance.apps.set(apps);
	};

	Apps.getWsListener().registerListener(AppEvents.APP_ADDED, instance.onAppAdded);
	Apps.getWsListener().registerListener(AppEvents.APP_REMOVED, instance.onAppAdded);
});

Template.apps.onDestroyed(function() {
	const instance = this;

	Apps.getWsListener().unregisterListener(AppEvents.APP_ADDED, instance.onAppAdded);
	Apps.getWsListener().unregisterListener(AppEvents.APP_REMOVED, instance.onAppAdded);
});

Template.apps.helpers({
	isReady() {
		if (Template.instance().ready != null) {
			return Template.instance().ready.get();
		}

		return false;
	},
	apps() {
		const instance = Template.instance();
		const searchText = instance.searchText.get().toLowerCase();
		const sortColumn = instance.searchSortBy.get();
		const inverted = instance.sortDirection.get() === 'desc';
		return sortByColumn(instance.apps.get().filter((app) => app.latest.name.toLowerCase().includes(searchText)), sortColumn, inverted);
	},
	categories() {
		return Template.instance().categories.get();
	},
	appsDevelopmentMode() {
		return settings.get('Apps_Framework_Development_Mode') === true;
	},
	parseStatus(status) {
		return t(`App_status_${ status }`);
	},
	isActive(status) {
		return enabled({ status });
	},
	sortIcon(key) {
		const {
			sortDirection,
			searchSortBy,
		} = Template.instance();

		return key === searchSortBy.get() && sortDirection.get() !== 'asc' ? 'sort-up' : 'sort-down';
	},
	searchSortBy(key) {
		return Template.instance().searchSortBy.get() === key;
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	onTableScroll() {
		const instance = Template.instance();
		if (instance.loading || instance.end.get()) {
			return;
		}
		return function(currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop >= currentTarget.scrollHeight - 100) {
				return instance.page.set(instance.page.get() + 1);
			}
		};
	},
	onTableResize() {
		const { limit } = Template.instance();

		return function() {
			limit.set(Math.ceil((this.$('.table-scroll').height() / 40) + 5));
		};
	},
	onTableSort() {
		const { end, page, sortDirection, searchSortBy } = Template.instance();
		return function(type) {
			end.set(false);
			page.set(0);

			if (searchSortBy.get() === type) {
				sortDirection.set(sortDirection.get() === 'asc' ? 'desc' : 'asc');
				return;
			}

			searchSortBy.set(type);
			sortDirection.set('asc');
		};
	},
	formatCategories(categories = []) {
		return categories.join(', ');
	},
});

Template.apps.events({
	'click .manage'() {
		const rl = this;

		if (rl && rl.latest && rl.latest.id) {
			FlowRouter.go(`/admin/apps/${ rl.latest.id }?version=${ rl.latest.version }`);
		}
	},
	'click [data-button="install_app"]'() {
		FlowRouter.go('marketplace');
	},
	'click [data-button="upload_app"]'() {
		FlowRouter.go('app-install');
	},
	'keyup .js-search'(e, t) {
		t.searchText.set(e.currentTarget.value);
	},
	'submit .js-search-form'(e) {
		e.preventDefault();
		e.stopPropagation();
	},
});

Template.apps.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
