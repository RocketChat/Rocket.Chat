import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { AutoComplete } from 'meteor/mizzao:autocomplete';
import { ChatRoom } from '../../../models';
import { t, roomTypes } from '../../../utils';
import { settings } from '../../../settings';
import { modal, call } from '../../../ui-utils';
import moment from 'moment';

const getRoomName = function() {
	const room = ChatRoom.findOne(Session.get('openedRoom'));
	if (!room) {
		return;
	}
	if (room.name) {
		return `#${ room.name }`;
	}

	return t('conversation_with_s', roomTypes.getRoomName(room.t, room));
};

const purgeWorker = function(roomId, oldest, latest, inclusive, limit, excludePinned, ignoreDiscussion, filesOnly, fromUsers) {
	return call('cleanRoomHistory', {
		roomId,
		latest,
		oldest,
		inclusive,
		limit,
		excludePinned,
		ignoreDiscussion,
		filesOnly,
		fromUsers,
	});
};


const getTimeZoneOffset = function() {
	const offset = new Date().getTimezoneOffset();
	const absOffset = Math.abs(offset);
	return `${ offset < 0 ? '+' : '-' }${ `00${ Math.floor(absOffset / 60) }`.slice(-2) }:${ `00${ (absOffset % 60) }`.slice(-2) }`;
};


const filterNames = (old) => {
	const reg = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	return [...old.replace(' ', '').toLocaleLowerCase()].filter((f) => reg.test(f)).join('');
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
		return Template.instance().cleanHistoryFilesOnly.get();
	},
	busy() {
		return Template.instance().cleanHistoryBusy.get();
	},
	finished() {
		return Template.instance().cleanHistoryFinished.get();
	},
	prunedCount() {
		return Template.instance().cleanHistoryPrunedCount.get();
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
			},
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
						exceptions: Template.instance().selectedUsers.get(),
					},
					selector(match) {
						return {
							term: match,
						};
					},
					sort: 'username',
				},
			],
		};
	},
	selectedUsers() {
		return Template.instance().selectedUsers.get();
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
});

Template.cleanHistory.onCreated(function() {
	this.warningBox = new ReactiveVar('');
	this.validate = new ReactiveVar('');
	this.selectedUsers = new ReactiveVar([]);
	this.userFilter = new ReactiveVar('');

	this.cleanHistoryFromDate = new ReactiveVar('');
	this.cleanHistoryFromTime = new ReactiveVar('');
	this.cleanHistoryToDate = new ReactiveVar('');
	this.cleanHistoryToTime = new ReactiveVar('');
	this.cleanHistorySelectedUsers = new ReactiveVar([]);
	this.cleanHistoryInclusive = new ReactiveVar(false);
	this.cleanHistoryExcludePinned = new ReactiveVar(false);
	this.cleanHistoryFilesOnly = new ReactiveVar(false);

	this.ignoreDiscussion = new ReactiveVar(false);


	this.cleanHistoryBusy = new ReactiveVar(false);
	this.cleanHistoryFinished = new ReactiveVar(false);
	this.cleanHistoryPrunedCount = new ReactiveVar(0);

	this.ac = new AutoComplete(
		{
			selector: {
				item: '.rc-popup-list__item',
				container: '.rc-popup-list__list',
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
					sort: 'username',
				},
			],

		});
	this.ac.tmplInst = this;
});

Template.cleanHistory.onRendered(function() {
	const users = this.selectedUsers;
	const selUsers = this.cleanHistorySelectedUsers;

	this.ac.element = this.firstNode.parentElement.querySelector('[name="users"]');
	this.ac.$element = $(this.ac.element);
	this.ac.$element.on('autocompleteselect', function(e, { item }) {
		const usersArr = users.get();
		usersArr.push(item);
		users.set(usersArr);
		selUsers.set(usersArr);
	});

	Tracker.autorun(() => {
		const metaFromDate = this.cleanHistoryFromDate.get();
		const metaFromTime = this.cleanHistoryFromTime.get();
		const metaToDate = this.cleanHistoryToDate.get();
		const metaToTime = this.cleanHistoryToTime.get();
		const metaSelectedUsers = this.cleanHistorySelectedUsers.get();
		const metaCleanHistoryExcludePinned = this.cleanHistoryExcludePinned.get();
		const metaCleanHistoryFilesOnly = this.cleanHistoryFilesOnly.get();

		let fromDate = new Date('0001-01-01T00:00:00Z');
		let toDate = new Date('9999-12-31T23:59:59Z');

		if (metaFromDate) {
			fromDate = new Date(`${ metaFromDate }T${ metaFromTime || '00:00' }:00${ getTimeZoneOffset() }`);
		}

		if (metaToDate) {
			toDate = new Date(`${ metaToDate }T${ metaToTime || '00:00' }:00${ getTimeZoneOffset() }`);
		}

		const exceptPinned = metaCleanHistoryExcludePinned ? ` ${ t('except_pinned', {}) }` : '';
		const ifFrom = metaSelectedUsers.length ? ` ${ t('if_they_are_from', {
			postProcess: 'sprintf',
			sprintf: [metaSelectedUsers.map((element) => element.username).join(', ')],
		}) }` : '';
		const filesOrMessages = t(metaCleanHistoryFilesOnly ? 'files' : 'messages', {});

		if (metaFromDate && metaToDate) {
			this.warningBox.set(t('Prune_Warning_between', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName(), moment(fromDate).format('L LT'), moment(toDate).format('L LT')],
			}) + exceptPinned + ifFrom);
		} else if (metaFromDate) {
			this.warningBox.set(t('Prune_Warning_after', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName(), moment(fromDate).format('L LT')],
			}) + exceptPinned + ifFrom);
		} else if (metaToDate) {
			this.warningBox.set(t('Prune_Warning_before', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName(), moment(toDate).format('L LT')],
			}) + exceptPinned + ifFrom);
		} else {
			this.warningBox.set(t('Prune_Warning_all', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName()],
			}) + exceptPinned + ifFrom);
		}

		if (fromDate > toDate) {
			return this.validate.set(t('Newer_than_may_not_exceed_Older_than', {
				postProcess: 'sprintf',
				sprintf: [],
			}));
		}
		if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
			return this.validate.set(t('error-invalid-date', {
				postProcess: 'sprintf',
				sprintf: [],
			}));
		}
		this.validate.set('');
	});
});

Template.cleanHistory.events({
	'change [name=from__date]'(e, instance) {
		instance.cleanHistoryFromDate.set(e.target.value);
	},
	'change [name=from__time]'(e, instance) {
		instance.cleanHistoryFromTime.set(e.target.value);
	},
	'change [name=to__date]'(e, instance) {
		instance.cleanHistoryToDate.set(e.target.value);
	},
	'change [name=to__time]'(e, instance) {
		instance.cleanHistoryToTime.set(e.target.value);
	},
	'change [name=inclusive]'(e, instance) {
		instance.cleanHistoryInclusive.set(e.target.checked);
	},
	'change [name=excludePinned]'(e, instance) {
		instance.cleanHistoryExcludePinned.set(e.target.checked);
	},
	'change [name=filesOnly]'(e, instance) {
		instance.cleanHistoryFilesOnly.set(e.target.checked);
	},
	'change [name=ignoreDiscussion]'(e, instance) {
		instance.ignoreDiscussion.set(e.target.checked);
	},
	'click .js-prune'(e, instance) {
		modal.open({
			title: t('Are_you_sure'),
			text: t('Prune_Modal'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_prune_them'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false,
		}, async function() {
			instance.cleanHistoryBusy.set(true);
			const metaFromDate = instance.cleanHistoryFromDate.get();
			const metaFromTime = instance.cleanHistoryFromTime.get();
			const metaToDate = instance.cleanHistoryToDate.get();
			const metaToTime = instance.cleanHistoryToTime.get();
			const metaSelectedUsers = instance.cleanHistorySelectedUsers.get();
			const metaCleanHistoryInclusive = instance.cleanHistoryInclusive.get();
			const metaCleanHistoryExcludePinned = instance.cleanHistoryExcludePinned.get();
			const metaCleanHistoryFilesOnly = instance.cleanHistoryFilesOnly.get();
			const ignoreDiscussion = instance.ignoreDiscussion.get();

			let fromDate = new Date('0001-01-01T00:00:00Z');
			let toDate = new Date('9999-12-31T23:59:59Z');

			if (metaFromDate) {
				fromDate = new Date(`${ metaFromDate }T${ metaFromTime || '00:00' }:00${ getTimeZoneOffset() }`);
			}

			if (metaToDate) {
				toDate = new Date(`${ metaToDate }T${ metaToTime || '00:00' }:00${ getTimeZoneOffset() }`);
			}

			const roomId = Session.get('openedRoom');
			const users = metaSelectedUsers.map((element) => element.username);
			const limit = 2000;
			let count = 0;
			let result;
			do {
				result = await purgeWorker(roomId, fromDate, toDate, metaCleanHistoryInclusive, limit, metaCleanHistoryExcludePinned, ignoreDiscussion, metaCleanHistoryFilesOnly, users);
				count += result;
			} while (result === limit);

			instance.cleanHistoryPrunedCount.set(count);
			instance.cleanHistoryFinished.set(true);
		});
	},
	'click .rc-input--usernames .rc-tags__tag'({ target }, t) {
		const { username } = Blaze.getData(target);
		t.selectedUsers.set(t.selectedUsers.get().filter((user) => user.username !== username));
		t.cleanHistorySelectedUsers.set(t.selectedUsers.get());
	},
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'input [name="users"]'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
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
			t.cleanHistorySelectedUsers.set(usersArr);
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
	},
});
