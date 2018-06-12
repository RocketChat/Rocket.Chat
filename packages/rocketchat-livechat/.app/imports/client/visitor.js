/* globals Commands */
const msgStream = new Meteor.Streamer('room-messages');

export default {
	id: new ReactiveVar(null),
	token: new ReactiveVar(null),
	room: new ReactiveVar(null),
	data: new ReactiveVar(null),
	roomToSubscribe: new ReactiveVar(null),
	idleTimeLimit: new ReactiveVar(300000),
	idleTimeoutDisconnect: new ReactiveVar(600000),
	roomSubscribed: null,
	connected: null,

	register() {
		if (!localStorage.getItem('visitorToken')) {
			localStorage.setItem('visitorToken', Random.id());
		}

		this.token.set(localStorage.getItem('visitorToken'));
	},

	getId() {
		return this.id.get();
	},

	setId(id) {
		return this.id.set(id);
	},

	getData() {
		return this.data.get();
	},

	setData(data) {
		this.data.set(data);
	},

	getToken() {
		return this.token.get();
	},

	setRoom(rid) {
		this.room.set(rid);
	},

	getRoom(createOnEmpty = false) {
		let roomId = this.room.get();
		if (!roomId && createOnEmpty) {
			roomId = Random.id();
			this.room.set(roomId);
		}

		return roomId;
	},

	setIdleTimeLimit(time) {
		if (!(Number.isInteger(time)) || (time === this.idleTimeLimit.get())) {
			return;
		}

		const idleTime = time * 1000;
		this.idleTimeLimit.set(idleTime);

		if (this.connected) {
			UserPresence.awayTime = this.idleTimeLimit.get();
			UserPresence.restartTimer();
		}
	},

	getIdleTimeLimit() {
		return this.idleTimeLimit.get();
	},

	setIdleTimeoutConnection(time) {
		if (!(Number.isInteger(time)) || (time === this.idleTimeoutDisconnect.get())) {
			return;
		}
		const idleTimeoutDisconnect = time * 1000;
		this.idleTimeoutDisconnect.set(idleTimeoutDisconnect);
	},

	getIdleTimeoutDisconnect() {
		return this.idleTimeoutDisconnect.get();
	},

	isSubscribed(roomId) {
		return this.roomSubscribed === roomId;
	},

	subscribeToRoom(roomId) {
		if (this.roomSubscribed && this.roomSubscribed === roomId) {
			return;
		}

		this.roomSubscribed = roomId;

		const msgTypesNotDisplayed = ['livechat_video_call', 'livechat_navigation_history', 'au'];
		msgStream.on(roomId, { token: this.getToken() }, (msg) => {
			if (msg.t === 'command') {
				Commands[msg.msg] && Commands[msg.msg]();
			} else if (!msgTypesNotDisplayed.includes(msg.t)) {
				ChatMessage.upsert({ _id: msg._id }, msg);

				if (msg.t === 'livechat-close') {
					parentCall('callback', 'chat-ended');
				}

				// notification sound
				if (Session.equals('sound', true) && msg.u._id !== this.getId()) {
					const audio = document.getElementById('chatAudioNotification');
					audio.play();
				}
			}
		});
	},

	setConnected() {
		if (this.connected) {
			return;
		}
		const token = this.getToken();

		this.connected = true;
		Meteor.call('UserPresence:connect', token, { visitor: token });

		const idleTimeLimit = this.idleTimeLimit.get();

		self = this;

		Meteor.startup(function() {
			UserPresence.awayTime = idleTimeLimit;
			UserPresence.start(token);

			msgStream.onReconnect(() => {

				const roomId = self.getRoom();
				if (!roomId) {
					return;
				}

				RoomHistoryManager.getRoom(roomId).hasMore.set(true);
				RoomHistoryManager.getMore(roomId);
			});
		});
	}
};
