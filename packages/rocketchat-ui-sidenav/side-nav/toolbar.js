let isLoading;
let filterText = '';
let usernamesFromClient;
let resultsFromClient;

Meteor.startup(() => {
	isLoading = new ReactiveVar(false);
});

const toolbarSearch = {
	clear() {
		$('.toolbar-search__input').val('');
	},

	focus() {
		$('.toolbar-search__input').focus();
	}
};

this.toolbarSearch = toolbarSearch;

const getFromServer = (cb) => {
	isLoading.set(true);
	const currentFilter = filterText;

	Meteor.call('spotlight', currentFilter, usernamesFromClient, (err, results) => {
		if (currentFilter !== filterText) {
			return;
		}

		isLoading.set(false);

		if (err) {
			console.log(err);
			return false;
		}

		const resultsFromServer = [];
		const usersLength = results.users.length;
		const roomsLength = results.rooms.length;

		if (usersLength) {
			for (let i = 0; i < usersLength; i++) {
				resultsFromServer.push({
					_id: results.users[i]._id,
					t: 'd',
					name: results.users[i].username
				});
			}
		}

		if (roomsLength) {
			for (let i = 0; i < roomsLength; i++) {
				resultsFromServer.push({
					_id: results.rooms[i]._id,
					t: results.rooms[i].t,
					name: results.rooms[i].name
				});
			}
		}

		if (resultsFromServer.length) {
			cb(resultsFromClient.concat(resultsFromServer));
		}
	});
};

const getFromServerDebounced = _.debounce(getFromServer, 500);

Template.toolbar.helpers({
	results() {
		return Template.instance().resultsList.get();
	},
	popupConfig() {
		const open = new ReactiveVar(false);

		Tracker.autorun(() => {
			if (open.get() === false) {
				toolbarSearch.clear();
			}
		});

		const config = {
			cls: 'search-results-list',
			collection: RocketChat.models.Subscriptions,
			template: 'toolbarSearchList',
			emptyTemplate: 'toolbarSearchListEmpty',
			input: '.toolbar-search__input',
			closeOnEsc: false,
			blurOnSelectItem: true,
			isLoading: isLoading,
			open: open,
			getFilter: function(collection, filter, cb) {
				filterText = filter;
				resultsFromClient = collection.find({name: new RegExp((RegExp.escape(filter)), 'i'), rid: {$ne: Session.get('openedRoom')}}, {limit: 20, sort: {unread: -1, ls: -1}}).fetch();

				const resultsFromClientLength = resultsFromClient.length;
				usernamesFromClient = [Meteor.user().username];

				for (let i = 0; i < resultsFromClientLength; i++) {
					if (resultsFromClient[i].t === 'd') {
						usernamesFromClient.push(resultsFromClient[i].name);
					}
				}

				cb(resultsFromClient);

				if (filterText.trim() !== '' && resultsFromClient.length < 20) {
					getFromServerDebounced(cb);
				}
			},
			getValue: function(_id, collection, records) {
				const doc = _.findWhere(records, {_id: _id});

				RocketChat.roomTypes.openRouteLink(doc.t, doc, FlowRouter.current().queryParams);
			}
		};

		return config;
	}
});

Template.toolbar.events({
	'keyup .toolbar-search__input'(e) {
		if (e.which === 27) {
			e.preventDefault();
			e.stopPropagation();

			const $inputMessage = $('textarea.input-message');

			if (0 === $inputMessage.length) {
				return;
			}

			$inputMessage.focus();
		}
	}
});

Template.toolbarSearchList.helpers({
	icon() {
		return RocketChat.roomTypes.getIcon(this.t);
	},

	userStatus() {
		if (this.t === 'd') {
			return 'status-' + (Session.get(`user_${this.name}_status`) || 'offline');
		} else {
			return 'status-' + (RocketChat.roomTypes.getUserStatus(this.t, this.rid || this._id) || 'offline');
		}
	}
});
