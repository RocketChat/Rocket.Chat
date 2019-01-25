import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import { timeAgo } from './helpers';
import { t, roomTypes } from 'meteor/rocketchat:utils';
import { settings } from 'meteor/rocketchat:settings';
import { hasAtLeastOnePermission } from 'meteor/rocketchat:authorization';

function directorySearch(config, cb) {
	return Meteor.call('browseChannels', config, (err, result) => {
		cb(result && result.results && result.results.length && result.results.map((result) => {
			if (config.type === 'channels') {
				return {
					name: result.name,
					users: result.usersCount || 0,
					createdAt: timeAgo(result.ts, t),
					lastMessage: result.lastMessage && timeAgo(result.lastMessage.ts, t),
					description: result.description,
					archived: result.archived,
					topic: result.topic,
				};
			}

			if (config.type === 'users') {
				return {
					name: result.name,
					username: result.username,
					createdAt: timeAgo(result.createdAt, t),
				};
			}
			return null;
		}));
	});
}

Template.directory.helpers({
	searchText() {
		return Template.instance().searchText.get();
	},
	showLastMessage() {
		return settings.get('Store_Last_Message');
	},
	searchResults() {
		return Template.instance().results.get();
	},
	searchType() {
		return Template.instance().searchType.get();
	},
	sortIcon(key) {
		const { sortDirection, searchSortBy } = Template.instance();

		return key === searchSortBy.get() && sortDirection.get() === 'asc'
			? 'sort-up'
			: 'sort-down';
	},
	searchSortBy(key) {
		return Template.instance().searchSortBy.get() === key;
	},
	createChannelOrGroup() {
		return hasAtLeastOnePermission(['create-c', 'create-p']);
	},
	tabsData() {
		const {
			sortDirection,
			searchType,
			searchSortBy,
			results,
			end,
			page,
		} = Template.instance();
		const channelsTab = {
			label: t('Channels'),
			value: 'channels',
			condition() {
				return true;
			},
		};
		const usersTab = {
			label: t('Users'),
			value: 'users',
			condition() {
				return true;
			},
		};
		if (searchType.get() === 'channels') {
			channelsTab.active = true;
		} else {
			usersTab.active = true;
		}
		return {
			tabs: [channelsTab, usersTab],
			onChange(value) {
				results.set([]);
				end.set(false);
				if (value === 'channels') {
					searchSortBy.set('usersCount');
					sortDirection.set('desc');
				} else {
					searchSortBy.set('name');
					sortDirection.set('asc');
				}
				page.set(0);
				searchType.set(value);
			},
		};
	},
	onTableItemClick() {
		const { searchType } = Template.instance();
		let type;
		let routeConfig;
		return function(item) {
			if (searchType.get() === 'channels') {
				type = 'c';
				routeConfig = { name: item.name };
			} else {
				type = 'd';
				routeConfig = { name: item.username };
			}
			roomTypes.openRouteLink(type, routeConfig);
		};
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	onTableScroll() {
		const instance = Template.instance();
		if (instance.isLoading.get() || instance.end.get()) {
			return;
		}
		return function(currentTarget) {
			if (
				currentTarget.offsetHeight + currentTarget.scrollTop >=
				currentTarget.scrollHeight - 100
			) {
				return instance.page.set(instance.page.get() + 1);
			}
		};
	},
	onTableResize() {
		const { limit } = Template.instance();

		return function() {
			limit.set(Math.ceil(this.$('.table-scroll').height() / 40 + 5));
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
});

Template.directory.events({
	'input .js-search': _.debounce((e, t) => {
		t.end.set(false);
		t.sortDirection.set('asc');
		t.page.set(0);
		t.searchText.set(e.currentTarget.value);
	}, 300),
});

Template.directory.onRendered(function() {
	Tracker.autorun(() => {
		const searchConfig = {
			text: this.searchText.get(),
			type: this.searchType.get(),
			sortBy: this.searchSortBy.get(),
			sortDirection: this.sortDirection.get(),
			limit: this.limit.get(),
			page: this.page.get(),
		};
		if (this.end.get() || this.loading) {
			return;
		}
		this.loading = true;
		this.isLoading.set(true);
		directorySearch(searchConfig, (result) => {
			this.loading = false;
			this.isLoading.set(false);
			this.end.set(!result);

			if (!Array.isArray(result)) {
				result = [];
			}

			if (this.page.get() > 0) {
				return this.results.set([...this.results.get(), ...result]);
			}
			return this.results.set(result);
		});
	});
});

Template.directory.onCreated(function() {
	const viewType = settings.get('Accounts_Directory_DefaultView') || 'channels';
	this.searchType = new ReactiveVar(viewType);
	if (viewType === 'channels') {
		this.searchSortBy = new ReactiveVar('usersCount');
		this.sortDirection = new ReactiveVar('desc');
	} else {
		this.searchSortBy = new ReactiveVar('name');
		this.sortDirection = new ReactiveVar('asc');
	}
	this.searchText = new ReactiveVar('');
	this.limit = new ReactiveVar(0);
	this.page = new ReactiveVar(0);
	this.end = new ReactiveVar(false);

	this.results = new ReactiveVar([]);

	this.isLoading = new ReactiveVar(false);
});

Template.directory.onRendered(function() {
	$('.main-content').removeClass('rc-old');
	$('.rc-table-content').css('height', `calc(100vh - ${ document.querySelector('.rc-directory .rc-header').offsetHeight }px)`);
});
