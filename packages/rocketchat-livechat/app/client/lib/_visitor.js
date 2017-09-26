/* globals Commands */
const msgStream = new Meteor.Streamer('room-messages');

this.visitor = new class {
	constructor() {
		this.token = new ReactiveVar(null);
		this.room = new ReactiveVar(null);
		this.roomToSubscribe = new ReactiveVar(null);
		this.roomSubscribed = null;
	}

	register() {
		if (!localStorage.getItem('visitorToken')) {
			localStorage.setItem('visitorToken', Random.id());
		}

		this.token.set(localStorage.getItem('visitorToken'));
	}

	getToken() {
		return this.token.get();
	}

	setRoom(rid) {
		this.room.set(rid);
	}

	getRoom(createOnEmpty = false) {
		let roomId = this.room.get();
		if (!roomId && createOnEmpty) {
			roomId = Random.id();
			this.room.set(roomId);
		}

		return roomId;
	}

	isSubscribed(roomId) {
		return this.roomSubscribed === roomId;
	}

	subscribeToRoom(roomId) {
		if (this.roomSubscribed && this.roomSubscribed === roomId) {
			return;
		}

		this.roomSubscribed = roomId;

		msgStream.on(roomId, (msg) => {
			if (msg.t === 'command') {
				Commands[msg.msg] && Commands[msg.msg]();
			} else if (msg.t !== 'livechat_video_call') {
				ChatMessage.upsert({ _id: msg._id }, msg);

				if (msg.t === 'livechat-close') {
					parentCall('callback', 'chat-ended');
				}

				// notification sound
				if (Session.equals('sound', true) && msg.u._id !== Meteor.userId()) {
					const audioVolume = Meteor.user() && Meteor.user().settings && Meteor.user().settings.preferences && Meteor.user().settings.preferences.notificationsSoundVolume || 100;
					const audio = document.getElementById('chatAudioNotification');
					audio.volume = Number((audioVolume/100).toPrecision(2));
					audio.play();
				}
			}
		});
	}
};
