import _ from 'underscore';

/* DEFINITIONS
- If window loses focus user needs to scroll or click/touch some place
- On hit ESC enable read, force read of current room and remove unread mark
- When user change room disable read until user interaction
- Only read if mark of *first-unread* is visible for user or if flag *force* was passed
- Always read the opened room
- The default method *read* has a delay of 2000ms to prevent multiple reads and to user be able to see the mark
*/

// Meteor.startup ->
// window.addEventListener 'focus', ->
// readMessage.refreshUnreadMark(undefined, true)

const readMessage = new class {
	constructor() {
		this.debug = false;
		this.callbacks = [];
		this.read = _.debounce((force) => this.readNow(force), 1000);
		this.canReadMessage = false;
	}

	readNow(force) {
		if (force == null) { force = false; }
		if (this.debug) { console.log('--------------'); }
		if (this.debug) { console.log('readMessage -> readNow init process force:', force); }

		const self = this;

		self.refreshUnreadMark();

		if ((force !== true) && (this.canReadMessage === false)) {
			if (this.debug) { console.log('readMessage -> readNow canceled by canReadMessage: false'); }
			return;
		}

		const rid = Session.get('openedRoom');
		if (rid == null) {
			if (this.debug) { console.log('readMessage -> readNow canceled, no rid informed'); }
			return;
		}

		if (force === true) {
			if (this.debug) { console.log('readMessage -> readNow via force rid:', rid); }
			return Meteor.call('readMessages', rid, function() {
				RoomHistoryManager.getRoom(rid).unreadNotLoaded.set(0);
				self.refreshUnreadMark();
				return self.fireRead(rid);
			});
		}

		const subscription = ChatSubscription.findOne({rid});
		if (subscription == null) {
			if (this.debug) { console.log('readMessage -> readNow canceled, no subscription found for rid:', rid); }
			return;
		}

		if ((subscription.alert === false) && (subscription.unread === 0)) {
			if (this.debug) { console.log('readMessage -> readNow canceled, alert', subscription.alert, 'and unread', subscription.unread); }
			return;
		}

		const room = RoomManager.getOpenedRoomByRid(rid);
		if (room == null) {
			if (this.debug) { console.log('readMessage -> readNow canceled, no room found for typeName:', subscription.t + subscription.name); }
			return;
		}

		// Only read messages if user saw the first unread message
		const unreadMark = $('.message.first-unread');
		if (unreadMark.length > 0) {
			const position = unreadMark.position();
			const visible = (position != null ? position.top : undefined) >= 0;
			if (!visible && (room.unreadSince.get() != null)) {
				if (this.debug) { console.log('readMessage -> readNow canceled, unread mark visible:', visible, 'unread since exists', (room.unreadSince.get() != null)); }
				return;
			}
		// if unread mark is not visible and there is more more not loaded unread messages
		} else if (RoomHistoryManager.getRoom(rid).unreadNotLoaded.get() > 0) {
			return;
		}

		if (this.debug) { console.log('readMessage -> readNow rid:', rid); }
		Meteor.call('readMessages', rid, function() {
			RoomHistoryManager.getRoom(rid).unreadNotLoaded.set(0);
			self.refreshUnreadMark();
			return self.fireRead(rid);
		});
	}

	disable() {
		return this.canReadMessage = false;
	}

	enable() {
		return this.canReadMessage = document.hasFocus();
	}

	isEnable() {
		return this.canReadMessage === true;
	}

	onRead(cb) {
		return this.callbacks.push(cb);
	}

	fireRead(rid) {
		return Array.from(this.callbacks).map((cb) =>	cb(rid));
	}

	refreshUnreadMark(rid, force) {
		if (rid == null) { rid = Session.get('openedRoom'); }
		if (rid == null) {
			return;
		}

		const subscription = ChatSubscription.findOne({rid}, {reactive: false});
		if (subscription == null) {
			return;
		}

		const room = RoomManager.openedRooms[subscription.t + subscription.name];
		if (room == null) {
			return;
		}

		if (!subscription.alert && (subscription.unread === 0)) {
			room.unreadSince.set(undefined);
			return;
		}

		if ((force == null) && (subscription.rid === Session.get('openedRoom')) && document.hasFocus()) {
			return;
		}


		let lastReadRecord = ChatMessage.findOne({
			rid: subscription.rid,
			ts: {
				$lt: subscription.ls
			}
		}
			// 'u._id':
			// 	$ne: Meteor.userId()
			, {
			sort: {
				ts: -1
			}
		}
		);

		if ((lastReadRecord == null) && (RoomHistoryManager.getRoom(room.rid).unreadNotLoaded.get() === 0)) {
			lastReadRecord =
				{ts: new Date(0)};
		}

		if ((lastReadRecord != null) || (RoomHistoryManager.getRoom(room.rid).unreadNotLoaded.get() > 0)) {
			room.unreadSince.set(subscription.ls);
		} else {
			room.unreadSince.set(undefined);
		}

		if (lastReadRecord != null) {
			const firstUnreadRecord = ChatMessage.findOne({
				rid: subscription.rid,
				ts: {
					$gt: lastReadRecord.ts
				},
				'u._id': {
					$ne: Meteor.userId()
				}
			}
				, {
				sort: {
					ts: 1
				}
			}
			);

			if (firstUnreadRecord != null) {
				room.unreadFirstId = firstUnreadRecord._id;
				$(room.dom).find(`.message#${ firstUnreadRecord._id }`).addClass('first-unread');
			}
		}
	}
};


Meteor.startup(function() {
	$(window).on('blur', () => readMessage.disable());

	$(window).on('focus', () => {
		readMessage.enable();
		return readMessage.read();
	});

	$(window).on('click', () => {
		readMessage.enable();
		return readMessage.read();
	});

	$(window).on('touchend', () => {
		readMessage.enable();
		return readMessage.read();
	});

	$(window).on('keyup', (e) => {
		const key = e.which;
		if (key === 27) {
			readMessage.enable();
			readMessage.readNow(true);
			return $('.message.first-unread').removeClass('first-unread');
		}
	});
});
export { readMessage };
this.readMessage = readMessage;
