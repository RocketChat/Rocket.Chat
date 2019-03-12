import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { Rooms, Subscriptions } from '/app/models';
import { roomTypes } from '/app/utils';
import { hasAtLeastOnePermission } from '/app/authorization';
import { menu } from '/app/ui-utils';
import { toolbarSearch } from './sidebarHeader';
import _ from 'underscore';

let filterText = '';
let usernamesFromClient;
let resultsFromClient;

const isLoading = new ReactiveVar(false);

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
					fname: results.users[i].name,
				});
			}
		}

		if (roomsLength) {
			for (let i = 0; i < roomsLength; i++) {
				const alreadyOnClient = resultsFromClient.find((item) => item._id === results.rooms[i]._id);
				if (alreadyOnClient) {
					continue;
				}

				resultsFromServer.push({
					_id: results.rooms[i]._id,
					t: results.rooms[i].t,
					name: results.rooms[i].name,
					lastMessage: results.rooms[i].lastMessage,
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
	getPlaceholder() {
		let placeholder = TAPi18n.__('Search');

		if (!Meteor.Device.isDesktop()) {
			return placeholder;
		} else if (window.navigator.platform.toLowerCase().includes('mac')) {
			placeholder = `${ placeholder } (\u2318+K)`;
		} else {
			placeholder = `${ placeholder } (\u2303+K)`;
		}

		return placeholder;
	},
	popupConfig() {
		const config = {
			cls: 'search-results-list',
			collection: Meteor.userId() ? Subscriptions : Rooms,
			template: 'toolbarSearchList',
			sidebar: true,
			emptyTemplate: 'toolbarSearchListEmpty',
			input: '.toolbar__search .rc-input__element',
			cleanOnEnter: true,
			closeOnEsc: true,
			blurOnSelectItem: true,
			isLoading,
			open: Template.instance().open,
			getFilter(collection, filter, cb) {
				filterText = filter;

				const type = {
					users: true,
					rooms: true,
				};

				const query = {
					rid: {
						$ne: Session.get('openedRoom'),
					},
				};

				if (!Meteor.userId()) {
					query._id = query.rid;
					delete query.rid;
				}
				const searchForChannels = filterText[0] === '#';
				const searchForDMs = filterText[0] === '@';
				if (searchForChannels) {
					filterText = filterText.slice(1);
					type.users = false;
					query.t = 'c';
				}

				if (searchForDMs) {
					filterText = filterText.slice(1);
					type.rooms = false;
					query.t = 'd';
				}

				const searchQuery = new RegExp((RegExp.escape(filterText)), 'i');
				query.$or = [
					{ name: searchQuery },
					{ fname: searchQuery },
				];

				resultsFromClient = collection.find(query, { limit: 20, sort: { unread: -1, ls: -1 } }).fetch();

				const resultsFromClientLength = resultsFromClient.length;
				const user = Meteor.users.findOne(Meteor.userId(), { fields: { name: 1, username:1 } });
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
				const doc = _.findWhere(records, { _id });

				roomTypes.openRouteLink(doc.t, doc, FlowRouter.current().queryParams);
				menu.close();
			},
		};

		return config;
	},
});

Template.toolbar.events({
	'submit form'(e) {
		e.preventDefault();
		return false;
	},

	'click [role="search"] input'() {
		toolbarSearch.shortcut = false;
	},

	'keyup [role="search"] input'(e) {
		if (e.which === 27) {
			e.preventDefault();
			e.stopPropagation();

			toolbarSearch.clear();
		}
	},

	'click [role="search"] button, touchend [role="search"] button'(e) {
		if (hasAtLeastOnePermission(['create-c', 'create-p'])) {
			// TODO: resolve this name menu/sidebar/sidebav/flex...
			menu.close();
			FlowRouter.go('create-channel');
		} else {
			e.preventDefault();
		}
	},
});

Template.toolbar.onRendered(function() {
	this.$('.js-search').select().focus();
});

Template.toolbar.onCreated(function() {
	this.open = new ReactiveVar(true);

	Tracker.autorun(() => !this.open.get() && toolbarSearch.close());
});
