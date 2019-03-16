import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { AutoComplete } from 'meteor/mizzao:autocomplete';
import { ChatRoom } from '/app/models';
import { t, roomTypes } from '/app/utils';
import { settings } from '/app/settings';
import { modal, call } from '/app/ui-utils';
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

const purgeWorker = function(roomId, oldest, latest, inclusive, limit, excludePinned, ignoreThreads, filesOnly, fromUsers) {
	return call('cleanRoomHistory', {
		roomId,
		latest,
		oldest,
		inclusive,
		limit,
		excludePinned,
		ignoreThreads,
		filesOnly,
		fromUsers,
	});
};

const getTimeZoneOffset = function() {
	const offset = new Date().getTimezoneOffset();
	const absOffset = Math.abs(offset);
	return `${ offset < 0 ? '+' : '-' }${ (`00${ Math.floor(absOffset / 60) }`).slice(-2) }:${ (`00${ (absOffset % 60) }`).slice(-2) }`;
};


const filterNames = (old) => {
	const reg = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	return [...old.replace(' ', '').toLocaleLowerCase()].filter((f) => reg.test(f)).join('');
};

Template.cleanHistory.onCreated(() => {
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

	this.ignoreThreads = new ReactiveVar(false);

	this.cleanHistoryBusy = new ReactiveVar(false);
	this.cleanHistoryFinished = new ReactiveVar(false);
	this.cleanHistoryPrunedCount = new ReactiveVar(0);

	this.ac = new AutoComplete(
		{
			selector:{
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

Template.cleanHistory.helpers({
	roomId() {
		const room = ChatRoom.findOne(Session.get('openedRoom'));
		return room && room._id;
	},
	roomName() {
		return getRoomName();
	},
	warningBox: function () {
		return 'hello';
	}
});
