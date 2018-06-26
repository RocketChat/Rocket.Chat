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

const purgeWorker = function(roomId, fromDate, toDate, inclusive, limit, excludePinned, filesOnly) {
	Meteor.call('cleanRoomHistory', {
		roomId,
		latest: toDate,
		oldest: fromDate,
		inclusive,
		limit,
		excludePinned,
		filesOnly
	}, function(error, count) {
		if (error) {
			return handleError(error);
		}

		Session.set('cleanHistoryPrunedCount', Session.get('cleanHistoryPrunedCount') + count);

		const hasMore = (count === limit);

		if (hasMore) {
			purgeWorker(roomId, fromDate, toDate, inclusive, limit, excludePinned, filesOnly);
		} else {
			Session.set('cleanHistoryFinished', true);
		}
	});
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
	}
});

Template.cleanHistory.onCreated(function() {
	this.warningBox = new ReactiveVar('');
	this.validate = new ReactiveVar('');

	Session.set('cleanHistoryFromDate', '');
	Session.set('cleanHistoryFromTime', '');
	Session.set('cleanHistoryToDate', '');
	Session.set('cleanHistoryToTime', '');
	Session.set('cleanHistoryInclusive', false);
	Session.set('cleanHistoryExcludePinned', false);
	Session.set('cleanHistoryFilesOnly', false);

	Session.set('cleanHistoryBusy', false);
	Session.set('cleanHistoryFinished', false);
	Session.set('cleanHistoryPrunedCount', 0);
});

Template.cleanHistory.onRendered(function() {
	const t = this;

	Tracker.autorun(function() {
		const metaFromDate = Session.get('cleanHistoryFromDate');
		const metaFromTime = Session.get('cleanHistoryFromTime');
		const metaToDate = Session.get('cleanHistoryToDate');
		const metaToTime = Session.get('cleanHistoryToTime');
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
		const filesOrMessages = TAPi18n.__(metaCleanHistoryFilesOnly ? 'files' : 'messages', {}, user.language);

		if (metaFromDate && metaToDate) {
			t.warningBox.set(TAPi18n.__('Prune_Warning_between', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName(), moment(fromDate).format('L LT'), moment(toDate).format('L LT')]
			}, user.language) + exceptPinned);
		} else if (metaFromDate) {
			t.warningBox.set(TAPi18n.__('Prune_Warning_after', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName(), moment(fromDate).format('L LT')]
			}, user.language) + exceptPinned);
		} else if (metaToDate) {
			t.warningBox.set(TAPi18n.__('Prune_Warning_before', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName(), moment(toDate).format('L LT')]
			}, user.language) + exceptPinned);
		} else {
			t.warningBox.set(TAPi18n.__('Prune_Warning_all', {
				postProcess: 'sprintf',
				sprintf: [filesOrMessages, getRoomName()]
			}, user.language) + exceptPinned);
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

			purgeWorker(roomId, fromDate, toDate, metaCleanHistoryInclusive, 250, metaCleanHistoryExcludePinned, metaCleanHistoryFilesOnly);
		});
	}
});
