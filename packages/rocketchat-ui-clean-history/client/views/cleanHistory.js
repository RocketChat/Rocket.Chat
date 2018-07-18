/* globals AutoComplete */

import moment from 'moment';

const getRoomName = function() {
	const room = ChatRoom.findOne(Session.get('openedRoom'));

	if (room && room.name) {
		return `#${ room.name }`;
	} else if (room && room._id) {
		const roomData = Session.get(`roomData${ room._id }`);
		if (!roomData) { return ''; }

		return TAPi18n.__('conversation_with_s', RocketChat.roomTypes.getRoomName(roomData.t, roomData));
	}
};

const getTimeZoneOffset = function() {
	const offset = new Date().getTimezoneOffset();
	const absOffset = Math.abs(offset);
	return `${ offset < 0 ? '+' : '-' }${ (`00${ Math.floor(absOffset / 60) }`).slice(-2) }:${ (`00${ (absOffset % 60) }`).slice(-2) }`;
};

const purgeWorker = function(roomId, fromDate, toDate, inclusive, limit, excludePinned, filesOnly, fromUsers) {
	Meteor.call('cleanRoomHistory', {
		roomId,
		latest: toDate,
		oldest: fromDate,
		inclusive,
		limit,
		excludePinned,
		filesOnly,
		fromUsers
	}, function(error, count) {
		if (error) {
			return handleError(error);
		}

		Session.set('cleanHistoryPrunedCount', Session.get('cleanHistoryPrunedCount') + count);

		const hasMore = (count === limit);

		if (hasMore) {
			purgeWorker(roomId, fromDate, toDate, inclusive, limit, excludePinned, filesOnly, fromUsers);
		} else {
			Session.set('cleanHistoryFinished', true);
		}
	});
};

const filterNames = (old) => {
	const reg = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	return [...old.replace(' ', '').toLocaleLowerCase()].filter(f => reg.test(f)).join('');
};

Template.cleanHistory.helpers({
	roomId() {
		const room = ChatRoom.findOne(Session.get('openedRoom'));
		return room && room._id;
	},
	roomName() {
		return getRoomName();
	},
	warningBox() {
		return Template.instance().warningBox.get();
	},
	validate() {
		return Template.instance().validate.get();
	},
	filesOnly() {
		return Session.get('cleanHistoryFilesOnly');
	},
	busy() {
		return Session.get('cleanHistoryBusy');
	},
	finished() {
		return Session.get('cleanHistoryFinished');
	},
	prunedCount() {
		return Session.get('cleanHistoryPrunedCount');
	},
	config() {
		const filter = Template.instance().userFilter;
		return {
			filter: filter.get(),
			noMatchTemplate: 'userSearchEmpty',
			modifier(text) {
				const f = filter.get();
				return `@${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), function(part) {
					return `<strong>${ part }</strong>`;
				}) }`;
			}
		};
	},
	autocompleteSettings() {
		return {
			limit: 10,
			rules: [
				{
					collection: 'CachedChannelList',
					subscription: 'userAutocomplete',
					field: 'username',
					template: Template.userSearch,
					noMatchTemplate: Template.userSearchEmpty,
					matchAll: true,
					filter: {
						exceptions: Template.instance().selectedUsers.get()
					},
					selector(match) {
						return {
							term: match
						};
					},
					sort: 'username'
				}
			]
		};
	},
	selectedUsers() {
		return Template.instance().selectedUsers.get();
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac): param;
	},
	items() {
		return Template.instance().ac.filteredList();
	}
});

Template.cleanHistory.onCreated(function() {
	this.warningBox = new ReactiveVar('');
	this.validate = new ReactiveVar('');
	this.selectedUsers = new ReactiveVar([]);
	this.userFilter = new ReactiveVar('');

	Session.set('cleanHistoryFromDate', '');
	Session.set('cleanHistoryFromTime', '');
	Session.set('cleanHistoryToDate', '');
	Session.set('cleanHistoryToTime', '');
	Session.set('cleanHistoryInclusive', false);
	Session.set('cleanHistoryExcludePinned', false);
	Session.set('cleanHistoryFilesOnly', false);
	Session.set('cleanHistorySelectedUsers', []);

	Session.set('cleanHistoryBusy', false);
	Session.set('cleanHistoryFinished', false);
	Session.set('cleanHistoryPrunedCount', 0);

	this.ac = new AutoComplete(
		{
			selector:{
				item: '.rc-popup-list__item',
				container: '.rc-popup-list__list'
			},

			limit: 10,
			inputDelay: 300,
			rules: [
				{
					collection: 'UserAndRoom',
					subscription: 'userAutocomplete',
					field: 'username',
					matchAll: true,
					doNotChangeWidth: false,
					selector(match) {
						return { term: match };
					},
					sort: 'username'
				}
			]

		});
	this.ac.tmplInst = this;
});

Template.cleanHistory.onRendered(function() {
	const t = this;
	const users = this.selectedUsers;

	this.ac.element = this.firstNode.parentElement.querySelector('[name="users"]');
	this.ac.$element = $(this.ac.element);
	this.ac.$element.on('autocompleteselect', function(e, {item}) {
		const usersArr = users.get();
		usersArr.push(item);
		users.set(usersArr);
		Session.set('cleanHistorySelectedUsers', usersArr);
	});

	Tracker.autorun(function() {
		const metaFromDate = Session.get('cleanHistoryFromDate');
		const metaFromTime = Session.get('cleanHistoryFromTime');
		const metaToDate = Session.get('cleanHistoryToDate');
		const metaToTime = Session.get('cleanHistoryToTime');
		const metaSelectedUsers = Session.get('cleanHistorySelectedUsers');
		const metaCleanHistoryExcludePinned = Session.get('cleanHistoryExcludePinned');
		const metaCleanHistoryFilesOnly = Session.get('cleanHistoryFilesOnly');

		let fromDate = new Date('0001-01-01T00:00:00Z');
		let toDate = new Date('9999-12-31T23:59:59Z');

		if (metaFromDate) {
			fromDate = new Date(`${ metaFromDate }T${ metaFromTime || '00:00' }:00${ getTimeZoneOffset() }`);
		}

		if (metaToDate) {
			toDate = new Date(`${ metaToDate }T${ metaToTime || '00:00' }:00${ getTimeZoneOffset() }`);
		}

		const user = Meteor.users.findOne(Meteor.userId());
		const exceptPinned = metaCleanHistoryExcludePinned ? ` ${ TAPi18n.__('except_pinned', {}, user.language) }` : '';
		const ifFrom = metaSelectedUsers.length ? ` ${ TAPi18n.__('if_they_are_from', {
			postProcess: 'sprintf',
			sprintf: [metaSelectedUsers.map(element => element.username).join(', ')]
		}, user.language) }` : '';
		const filesOrMessages = TAPi18n.__(metaCleanHistoryFilesOnly ? 'files' : 'messages', {}, user.language);

		if (metaFromDate && metaToDate) {
			t.warningBox.set(TAPi18n.__('Prune_Warning_between', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName(), moment(fromDate).format('L LT'), moment(toDate).format('L LT')]
			}, user.language) + exceptPinned + ifFrom);
		} else if (metaFromDate) {
			t.warningBox.set(TAPi18n.__('Prune_Warning_after', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName(), moment(fromDate).format('L LT')]
			}, user.language) + exceptPinned + ifFrom);
		} else if (metaToDate) {
			t.warningBox.set(TAPi18n.__('Prune_Warning_before', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName(), moment(toDate).format('L LT')]
			}, user.language) + exceptPinned + ifFrom);
		} else {
			t.warningBox.set(TAPi18n.__('Prune_Warning_all', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName()]
			}, user.language) + exceptPinned + ifFrom);
		}

		if (fromDate > toDate) {
			t.validate.set(TAPi18n.__('Newer_than_may_not_exceed_Older_than', {
				postProcess: 'sprintf',
				sprintf: []
			}, user.language));
		} else if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
			t.validate.set(TAPi18n.__('error-invalid-date', {
				postProcess: 'sprintf',
				sprintf: []
			}, user.language));
		} else {
			t.validate.set('');
		}
	});
});

Template.cleanHistory.events({
	'change [name=from__date]'(e) {
		Session.set('cleanHistoryFromDate', e.target.value);
	},
	'change [name=from__time]'(e) {
		Session.set('cleanHistoryFromTime', e.target.value);
	},
	'change [name=to__date]'(e) {
		Session.set('cleanHistoryToDate', e.target.value);
	},
	'change [name=to__time]'(e) {
		Session.set('cleanHistoryToTime', e.target.value);
	},
	'change [name=inclusive]'(e) {
		Session.set('cleanHistoryInclusive', e.target.checked);
	},
	'change [name=excludePinned]'(e) {
		Session.set('cleanHistoryExcludePinned', e.target.checked);
	},
	'change [name=filesOnly]'(e) {
		Session.set('cleanHistoryFilesOnly', e.target.checked);
	},
	'click .js-prune'() {
		const metaFromDate = Session.get('cleanHistoryFromDate');
		const metaFromTime = Session.get('cleanHistoryFromTime');
		const metaToDate = Session.get('cleanHistoryToDate');
		const metaToTime = Session.get('cleanHistoryToTime');
		const metaSelectedUsers = Session.get('cleanHistorySelectedUsers');
		const metaCleanHistoryInclusive = Session.get('cleanHistoryInclusive');
		const metaCleanHistoryExcludePinned = Session.get('cleanHistoryExcludePinned');
		const metaCleanHistoryFilesOnly = Session.get('cleanHistoryFilesOnly');

		let fromDate = new Date('0001-01-01T00:00:00Z');
		let toDate = new Date('9999-12-31T23:59:59Z');

		if (metaFromDate) {
			fromDate = new Date(`${ metaFromDate }T${ metaFromTime || '00:00' }:00${ getTimeZoneOffset() }`);
		}

		if (metaToDate) {
			toDate = new Date(`${ metaToDate }T${ metaToTime || '00:00' }:00${ getTimeZoneOffset() }`);
		}

		const room = ChatRoom.findOne(Session.get('openedRoom'));
		if (!(room && room._id)) {
			return;
		}
		const roomId = room._id;

		modal.open({
			title: t('Are_you_sure'),
			text: t('Prune_Modal'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_prune_them'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false
		}, async function() {
			Session.set('cleanHistoryBusy', true);

			purgeWorker(roomId, fromDate, toDate, metaCleanHistoryInclusive, 250, metaCleanHistoryExcludePinned, metaCleanHistoryFilesOnly, metaSelectedUsers.map(element => element.username));
		});
	},
	'click .rc-input--usernames .rc-tags__tag'({target}, t) {
		const {username} = Blaze.getData(target);
		t.selectedUsers.set(t.selectedUsers.get().filter(user => user.username !== username));
		Session.set('cleanHistorySelectedUsers', t.selectedUsers.get());
	},
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'input [name="users"]'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const length = input.value.length;
		const modified = filterNames(input.value);
		input.value = modified;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);

		t.userFilter.set(modified);
	},
	'keydown [name="users"]'(e, t) {
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const users = t.selectedUsers;
			const usersArr = users.get();
			usersArr.pop();
			Session.set('cleanHistorySelectedUsers', usersArr);
			return users.set(usersArr);
		}

		t.ac.onKeyDown(e);
	},
	'keyup [name="users"]'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus [name="users"]'(e, t) {
		t.ac.onFocus(e);
	},
	'blur [name="users"]'(e, t) {
		t.ac.onBlur(e);
	}
});
