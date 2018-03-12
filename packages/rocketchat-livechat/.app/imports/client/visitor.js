/* globals Commands */
const msgStream = new Meteor.Streamer('room-messages');

export default {
	id: new ReactiveVar(null),
	token: new ReactiveVar(null),
	room: new ReactiveVar(null),
	data: new ReactiveVar(null),
	roomToSubscribe: new ReactiveVar(null),
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

		Meteor.startup(function() {
			UserPresence.awayTime = 300000; // 5 minutes
			UserPresence.start(token);
		});
	}
};
