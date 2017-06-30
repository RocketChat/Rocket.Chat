/* global menu */
let isLoading;
let filterText = '';
let usernamesFromClient;
let resultsFromClient;

Meteor.startup(() => {
	isLoading = new ReactiveVar(false);
});

const toolbarSearch = {
	shortcut: false,
	clear() {
		const $inputMessage = $('textarea.input-message');

		if (0 === $inputMessage.length) {
			return;
		}

		$inputMessage.focus();
		$('.toolbar-search__input').val('');

		if (this.shortcut) {
			menu.close();
		}
	},
	focus(fromShortcut) {
		menu.open();
		$('.toolbar-search__input').focus();
		this.shortcut = fromShortcut;
	}
};

this.toolbarSearch = toolbarSearch;

const getFromServer = (cb, type) => {
	isLoading.set(true);
	const currentFilter = filterText;

	Meteor.call('spotlight', currentFilter, usernamesFromClient, type, (err, results) => {
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
					name: results.users[i].username,
					fname: results.users[i].name
				});
			}
		}

		if (roomsLength) {
			for (let i = 0; i < roomsLength; i++) {
				const alreadyOnClient = resultsFromClient.find(item => item._id === results.rooms[i]._id);
				if (alreadyOnClient) {
					continue;
				}

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
	canCreate() {
		return RocketChat.authz.hasAtLeastOnePermission(['create-c', 'create-p']);
	},
	results() {
		return Template.instance().resultsList.get();
	},
	getPlaceholder() {
		let placeholder = TAPi18n.__('Search');

		if (!Meteor.Device.isDesktop()) {
			return placeholder;
		} else if (window.navigator.platform.toLowerCase().includes('mac')) {
			placeholder = `${ placeholder } (CMD+K)`;
		} else {
			placeholder = `${ placeholder } (Ctrl+K)`;
		}

		return placeholder;
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
			collection: Meteor.userId() ? RocketChat.models.Subscriptions : RocketChat.models.Rooms,
			template: 'toolbarSearchList',
			emptyTemplate: 'toolbarSearchListEmpty',
			input: '.toolbar-search__input',
			cleanOnEnter: true,
			closeOnEsc: false,
			blurOnSelectItem: true,
			isLoading,
			open,
			getFilter(collection, filter, cb) {
				filterText = filter;

				const type = {
					users: true,
					rooms: true
				};

				const query = {
					rid: {
						$ne: Session.get('openedRoom')
					}
				};

				if (!Meteor.userId()) {
					query._id = query.rid;
					delete query.rid;
				}

				if (filterText[0] === '#') {
					filterText = filterText.slice(1);
					type.users = false;
					query.t = 'c';
				}

				if (filterText[0] === '@') {
					filterText = filterText.slice(1);
					type.rooms = false;
					query.t = 'd';
				}

				const searchQuery = new RegExp((RegExp.escape(filterText)), 'i');
				query.$or = [
					{ name: searchQuery },
					{ fname: searchQuery }
				];

				resultsFromClient = collection.find(query, {limit: 20, sort: {unread: -1, ls: -1}}).fetch();

				const resultsFromClientLength = resultsFromClient.length;
				const user = Meteor.user();
				if (user) {
					usernamesFromClient = [user];
				}

				for (let i = 0; i < resultsFromClientLength; i++) {
					if (resultsFromClient[i].t === 'd') {
						usernamesFromClient.push(resultsFromClient[i].name);
					}
				}

				cb(resultsFromClient);

				// Use `filter` here to get results for `#` or `@` filter only
				if (resultsFromClient.length < 20) {
					getFromServerDebounced(cb, type);
				}
			},

			getValue(_id, collection, records) {
				const doc = _.findWhere(records, {_id});

				RocketChat.roomTypes.openRouteLink(doc.t, doc, FlowRouter.current().queryParams);
				menu.close();
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

			toolbarSearch.clear();
		}
	},

	'click .toolbar-search__input'() {
		toolbarSearch.shortcut = false;
	},

	'click .toolbar-search__create-channel, touchend .toolbar-search__create-channel'(e) {
		if (RocketChat.authz.hasAtLeastOnePermission(['create-c', 'create-p'])) {
			SideNav.setFlex('createCombinedFlex');
			SideNav.openFlex();
		} else {
			e.preventDefault();
		}
	},

	'blur .toolbar-search__input'() {
		toolbarSearch.clear();
	}
});

Template.toolbarSearchList.helpers({
	icon() {
		return RocketChat.roomTypes.getIcon(this.t);
	},
	userStatus() {
		if (this.t === 'd') {
			return `status-${ Session.get(`user_${ this.name }_status`) || 'offline' }`;
		} else {
			return `status-${ RocketChat.roomTypes.getUserStatus(this.t, this.rid || this._id) || 'offline' }`;
		}
	},

	displayName() {
		if (RocketChat.settings.get('UI_Use_Real_Name') && this.fname) {
			return this.fname;
		} else {
			return this.name;
		}
	}
});
