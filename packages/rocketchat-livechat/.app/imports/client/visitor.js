/* globals Commands, Livechat, UserPresence */
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';

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

	reset() {
		msgStream.unsubscribe(this.roomSubscribed);

		this.id.set(null);
		this.token.set(null);
		this.room.set(null);
		this.data.set(null);
		this.roomToSubscribe.set(null);
		this.roomSubscribed = null;

		Livechat.room = null;
		Livechat.department = null;
		Livechat.agent = null;
		Livechat.guestName = null;
		Livechat.guestEmail = null;
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

	getDepartment() {
		const data = this.getData();
		return data && data.department;
	},

	setToken(token) {
		if (!token || token === this.token.get()) {
			return;
		}

		this.reset();

		localStorage.setItem('visitorToken', token);
		this.token.set(token);

		Meteor.call('livechat:loginByToken', token, (err, result) => {

			if (!result) {
				return;
			}

			if (result._id) {
				this.setId(result._id);
				return result._id;
			}
		});
	},

	setName(name) {
		Livechat.guestName = name;

		if (!this.getId()) {
			return;
		}

		const data = {
			token: this.getToken(),
			name,
		};

		Meteor.call('livechat:registerGuest', data);
	},

	setEmail(email) {
		Livechat.guestEmail = email;

		if (!this.getId()) {
			return;
		}

		const data = {
			token: this.getToken(),
			email,
		};

		Meteor.call('livechat:registerGuest', data);
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

		msgStream.unsubscribe(this.roomSubscribed);

		this.roomSubscribed = roomId;

		const msgTypesNotDisplayed = ['livechat_video_call', 'livechat_navigation_history', 'au'];
		msgStream.on(roomId, { visitorToken: this.getToken() }, (msg) => {
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
	},
};
