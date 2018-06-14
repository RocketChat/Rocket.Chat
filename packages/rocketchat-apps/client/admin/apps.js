import { AppEvents } from '../communication';
const ENABLED_STATUS = ['auto_enabled', 'manually_enabled'];
const enabled = ({status}) => ENABLED_STATUS.includes(status);

Template.apps.onCreated(function() {
	const instance = this;
	this.ready = new ReactiveVar(false);
	this.apps = new ReactiveVar([]);
	this.filter = new ReactiveVar('');
	this.searchText = new ReactiveVar('');
	this.searchType = new ReactiveVar('channels');
	this.searchSortBy = new ReactiveVar('name');
	this.sortDirection = new ReactiveVar('asc');
	this.limit = new ReactiveVar(0);
	this.page = new ReactiveVar(0);
	this.end = new ReactiveVar(false);
	this.isLoading = new ReactiveVar(false);


	RocketChat.API.get('apps').then((result) => {
		instance.apps.set(result.apps);
		instance.ready.set(true);
	});

	instance.onAppAdded = function _appOnAppAdded(appId) {
		RocketChat.API.get(`apps/${ appId }`).then((result) => {
			const apps = instance.apps.get();
			apps.push(result.app);
			instance.apps.set(apps);
		});
	};

	instance.onAppRemoved = function _appOnAppRemoved(appId) {
		const apps = instance.apps.get();

		let index = -1;
		apps.find((item, i) => {
			if (item.id === appId) {
				index = i;
				return true;
			}
		});

		apps.splice(index, 1);
		instance.apps.set(apps);
	};

	window.Apps.getWsListener().registerListener(AppEvents.APP_ADDED, instance.onAppAdded);
	window.Apps.getWsListener().registerListener(AppEvents.APP_REMOVED, instance.onAppAdded);
});

Template.apps.onDestroyed(function() {
	const instance = this;

	window.Apps.getWsListener().unregisterListener(AppEvents.APP_ADDED, instance.onAppAdded);
	window.Apps.getWsListener().unregisterListener(AppEvents.APP_REMOVED, instance.onAppAdded);
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
		const filter = instance.filter.get().toLowerCase();
		// const sortOrder = instance.sortDirection.get();
		return instance.apps.get().filter(({name}) => name.toLowerCase().includes(filter));
	},
	parseStatus(status) {
		return t(`App_status_${ status }`);
	},
	isActive(status) {
		return enabled({status});
	},
	searchResults() {
		return Template.instance().results.get();
	},
	searchType() {
		return Template.instance().searchType.get();
	},
	sortIcon(key) {
		const {
			sortDirection,
			searchSortBy
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
	}
});

Template.apps.events({
	'click .manage'(e) {
		e.preventDefault();
		const rl = this;

		if (rl && rl.id) {
			FlowRouter.go(`/admin/apps/${ rl.id }`);
		}
	},
	'click [data-button="install"]'() {
		FlowRouter.go('/admin/app/install');
	},
	'keyup .js-search'(e, t) {
		t.filter.set(e.currentTarget.value);
	},
	'submit .js-search'(e) {
		e.preventDefault();
	}
});
