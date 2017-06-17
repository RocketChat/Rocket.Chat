Meteor.startup(function() {
	return RocketChat.MessageAction.addButton({
		id: 'jump-to-search-message',
		icon: 'icon-right-hand',
		i18nLabel: 'Jump_to_message',
		context: [
			'search'
		],
		action() {
			const message = this._arguments[1];
			if (Session.get('openedRoom') === message.rid) {
				return RoomHistoryManager.getSurroundingMessages(message, 50);
			}
			FlowRouter.goToRoomById(message.rid);
			RocketChat.MessageAction.hideDropDown();
			window.setTimeout(() => {
				RoomHistoryManager.getSurroundingMessages(message, 50);
			}, 400);
			// 400ms is popular among game devs as a good delay before transition starts
			// ie. 50, 100, 200, 400, 800 are the favored timings
		},
		order: 100
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
		return _.extend(this, { customClass: 'search' });
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

		t.hasMore.set(true);
		t.limit.set(20);
		return t.search(true);
	}
	, 500),

	'click .message-cog'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		const message_id = $(e.currentTarget).closest('.message').attr('id');
		const searchResult = t.searchResult.get();
		RocketChat.MessageAction.hideDropDown();
		t.$(`\#${ message_id } .message-dropdown`).remove();
		if (searchResult) {
			const message = _.findWhere(searchResult.messages, { _id: message_id });
			const actions = RocketChat.MessageAction.getButtons(message, 'search');
			const el = Blaze.toHTMLWithData(Template.messageDropdown, { actions });
			t.$(`\#${ message_id } .message-cog-container`).append(el);
			const dropDown = t.$(`\#${ message_id } .message-dropdown`);
			return dropDown.show();
		}
	},

	'click .load-more button'(e, t) {
		t.limit.set(t.limit.get() + 20);
		return t.search();
	},

	'scroll .content': _.throttle(function(e, t) {
		if (e.target.scrollTop >= (e.target.scrollHeight - e.target.clientHeight)) {
			t.limit.set(t.limit.get() + 20);
			return t.search();
		}
	}
	, 200)
});

Template.messageSearch.onCreated(function() {
	this.currentSearchTerm = new ReactiveVar('');
	this.searchResult = new ReactiveVar;

	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(20);
	this.ready = new ReactiveVar(true);

	return this.search = (globalSearch = false) => {
		this.ready.set(false);
		const value = this.$('#message-search').val();
		return Tracker.nonreactive(() => {
			return Meteor.call('messageSearch', value, (globalSearch) ? undefined: Session.get('openedRoom'), this.limit.get(), (error, result) => {
				this.currentSearchTerm.set(value);
				this.ready.set(true);
				if ((result != null) && (((result.messages != null ? result.messages.length : undefined) > 0) || ((result.users != null ? result.users.length : undefined) > 0) || ((result.channels != null ? result.channels.length : undefined) > 0))) {
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
