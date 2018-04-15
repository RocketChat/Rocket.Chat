import _ from 'underscore';

Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'jump-to-search-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: [
			'search'
		],
		action() {
			const message = this._arguments[1];
			if (Session.get('openedRoom') === message.rid) {
				return RoomHistoryManager.getSurroundingMessages(message, 50);
			}

			FlowRouter.goToRoomById(message.rid);
			// RocketChat.MessageAction.hideDropDown();

			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}

			window.setTimeout(() => {
				RoomHistoryManager.getSurroundingMessages(message, 50);
			}, 400);
			// 400ms is popular among game devs as a good delay before transition starts
			// ie. 50, 100, 200, 400, 800 are the favored timings
		},
		order: 100,
		group: 'menu'
	});
});


Template.messageSearch.helpers({
	tSearchMessages() {
		return t('Search_Messages');
	},

	searchResultMessages() {
		const searchResult = Template.instance().searchResult.get();
		if (searchResult) {
			return searchResult.messages;
		}
	},

	hasMore() {
		return Template.instance().hasMore.get();
	},

	currentSearchTerm() {
		return Template.instance().currentSearchTerm.get();
	},

	ready() {
		return Template.instance().ready.get();
	},

	message() {
		return _.extend(this, { customClass: 'search', actionContext: 'search'});
	},

	allowGlobalSearch() {
		return RocketChat.settings.get('Message_GlobalSearch');
	}
});

Template.messageSearch.events({
	'keydown #message-search'(e) {
		if (e.keyCode === 13) {
			return e.preventDefault();
		}
	},

	'keyup #message-search': _.debounce(function(e, t) {
		const value = e.target.value.trim();
		if ((value === '') && t.currentSearchTerm.get()) {
			t.currentSearchTerm.set('');
			t.searchResult.set(undefined);
			t.hasMore.set(false);
			return;
		} else if (value === t.currentSearchTerm.get()) {
			return;
		}
		const globalSearch = $('#global-search').is(':checked');
		t.hasMore.set(true);
		t.limit.set(20);
		return t.search(globalSearch);
	}, 500),

	'click .load-more button'(e, t) {
		t.limit.set(t.limit.get() + 20);
		return t.search();
	},

	'scroll .js-list': _.throttle(function(e, t) {
		if (e.target.scrollTop >= (e.target.scrollHeight - e.target.clientHeight)) {
			t.limit.set(t.limit.get() + 20);
			return t.search();
		}
	}, 200)
});

Template.messageSearch.onCreated(function() {
	this.currentSearchTerm = new ReactiveVar('');
	this.searchResult = new ReactiveVar();
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(20);
	this.ready = new ReactiveVar(true);

	return this.search = (globalSearch = false) => {
		this.ready.set(false);
		let value = this.$('#message-search').val();
		const regexBeginTest = RegExp('^\\/');
		if (!regexBeginTest.test(value)) {
			const regexTest = RegExp('^\\/.+(\\/[g|i|m|u|y]*$)');
			if (!regexTest.test(value)) {
				value = `/${ value }/`;
			}
		}
		console.log(value);
		return Tracker.nonreactive(() => {
			return Meteor.call('messageSearch', value, (globalSearch) ? undefined: Session.get('openedRoom'), this.limit.get(), (error, result) => {
				this.currentSearchTerm.set(value);
				this.ready.set(true);
				if ((result != null) && (((result.messages !== null ? result.messages.length : undefined) > 0) || ((result.users != null ? result.users.length : undefined) > 0) || ((result.channels != null ? result.channels.length : undefined) > 0))) {
					this.searchResult.set(result);
					if (((result.messages != null ? result.messages.length : undefined) + (result.users != null ? result.users.length : undefined) + (result.channels != null ? result.channels.length : undefined)) < this.limit.get()) {
						return this.hasMore.set(false);
					}
				} else {
					return this.searchResult.set();
				}
			}
			);
		}
		);
	};
});
