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
	return Meteor.call('browseChannels', config, (err, result) => {
		cb(result.map(room => {
			return {
				name: room.name,
				users: room.usernames.length,
				createdAt: timeAgo(room.ts),
				description: room.description,
				archived: room.archived
			};
		}));
	});
}

Template.directory.helpers({
	searchResults() {
		return Template.instance().results.get();
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
		FlowRouter.go(RocketChat.roomTypes.getRouteLink('c', {name: this.name}));
	}
});

Template.directory.onCreated(function() {
	this.searchText = new ReactiveVar('');
	this.searchType = new ReactiveVar('channels');
	this.results = new ReactiveVar([]);

	Tracker.autorun(() => {
		directorySearch({text: this.searchText.get(), type: this.searchType.get()}, (result) => {
			this.results.set(result);
		});
	});
});

Template.directory.onRendered(function() {
	$('.main-content').removeClass('rc-old');
	$('.rc-directory-content').css('height', `calc(100vh - ${ document.querySelector('.rc-directory .rc-header').offsetHeight }px)`);
});
