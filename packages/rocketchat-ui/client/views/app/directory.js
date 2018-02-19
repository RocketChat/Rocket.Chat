import moment from 'moment';

function timeAgo(time) {
	const now = new Date();
	const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

	return (
		now.getDate() === time.getDate() && moment(time).format('LT') ||
		yesterday.getDate() === time.getDate() && t('yesterday') ||
		moment(time).format('L')
	);
}

function directorySearch(config, cb) {
	return Meteor.call('browseChannels', config, (err, results) => {
		cb(results.map(result => {
			if (config.type === 'channels') {
				return {
					name: result.name,
					users: result.usernames.length,
					createdAt: timeAgo(result.ts),
					description: result.description,
					archived: result.archived
				};
			}

			if (config.type === 'users') {
				return {
					name: result.name,
					username: result.username,
					createdAt: timeAgo(result.createdAt)
				};
			}
		}));
	});
}

Template.directory.helpers({
	searchResults() {
		return Template.instance().results.get();
	},
	searchType() {
		return Template.instance().searchType.get();
	}
});

Template.directory.events({
	'input .js-search'(e, t) {
		t.searchText.set(e.currentTarget.value);
	},
	'change .js-typeSelector'(e, t) {
		t.searchType.set(e.currentTarget.value);
	},
	'click .rc-table-body .rc-table-tr'() {
		let searchType;
		let routeConfig;
		if (Template.instance().searchType.get() === 'channels') {
			searchType = 'c';
			routeConfig = {name: this.name};
		} else {
			searchType = 'd';
			routeConfig = {name: this.username};
		}
		FlowRouter.go(RocketChat.roomTypes.getRouteLink(searchType, routeConfig));
	},
	'click .js-sort'(e, t) {
		const el = e.currentTarget;
		const type = el.dataset.sort;

		$('.js-sort').removeClass('rc-table-td--bold');
		$(el).addClass('rc-table-td--bold');

		if (t.searchSortBy.get() === type) {
			t.sortDirection.set(t.sortDirection.get() === 'asc' ? 'desc' : 'asc');
			return;
		}

		t.searchSortBy.set(type);
		t.sortDirection.set('asc');
	},
	'click .rc-directory-plus'() {
		FlowRouter.go('create-channel');
	}
});

Template.directory.onCreated(function() {
	this.searchText = new ReactiveVar('');
	this.searchType = new ReactiveVar('channels');
	this.searchSortBy = new ReactiveVar('name');
	this.sortDirection = new ReactiveVar('asc');

	this.results = new ReactiveVar([]);

	Tracker.autorun(() => {
		const searchConfig = {
			text: this.searchText.get(),
			type: this.searchType.get(),
			sortBy: this.searchSortBy.get(),
			sortDirection: this.sortDirection.get()
		}
		directorySearch(searchConfig, (result) => {
			this.results.set(result);
		});
	});
});

Template.directory.onRendered(function() {
	$('.main-content').removeClass('rc-old');
	$('.rc-directory-content').css('height', `calc(100vh - ${ document.querySelector('.rc-directory .rc-header').offsetHeight }px)`);
});
