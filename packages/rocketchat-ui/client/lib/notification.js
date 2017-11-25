// @TODO implementar 'clicar na notificacao' abre a janela do chat
import _ from 'underscore';
import s from 'underscore.string';

const KonchatNotification = {
	notificationStatus: new ReactiveVar,

	// notificacoes HTML5
	getDesktopPermission() {
		if (window.Notification && (Notification.permission !== 'granted') && !Meteor.settings.public.sandstorm) {
			return Notification.requestPermission(function(status) {
				KonchatNotification.notificationStatus.set(status);
				if (Notification.permission !== status) {
					return Notification.permission = status;
				}
			});
		}
	},

	notify(notification) {
		if (window.Notification && Notification.permission === 'granted') {
			const message = { rid: (notification.payload != null ? notification.payload.rid : undefined), msg: notification.text, notification: true };
			return RocketChat.promises.run('onClientMessageReceived', message).then(function(message) {
				const n = new Notification(notification.title, {
					icon: notification.icon || getAvatarUrlFromUsername(notification.payload.sender.username),
					body: s.stripTags(message.msg),
					tag: notification.payload._id,
					silent: true,
					canReply: true
				});

				const user = Meteor.user();

				const notificationDuration = notification.duration - 0 || user && user.settings && user.settings.preferences && user.settings.preferences.desktopNotificationDuration - 0 || RocketChat.settings.get('Desktop_Notifications_Duration');
				if (notificationDuration > 0) {
					setTimeout((() => n.close()), notificationDuration * 1000);
				}

				if (notification.payload && notification.payload.rid) {
					if (n.addEventListener) {
						n.addEventListener('reply', ({response}) =>
							Meteor.call('sendMessage', {
								_id: Random.id(),
								rid: notification.payload.rid,
								msg: response
							})
						);
					}

					n.onclick = function() {
						this.close();
						window.focus();
						switch (notification.payload.type) {
							case 'd':
								return FlowRouter.go('direct', { username: notification.payload.sender.username }, FlowRouter.current().queryParams);
							case 'c':
								return FlowRouter.go('channel', { name: notification.payload.name }, FlowRouter.current().queryParams);
							case 'p':
								return FlowRouter.go('group', { name: notification.payload.name }, FlowRouter.current().queryParams);
						}
					};
				}
			});
		}
	},

	showDesktop(notification) {
		if ((notification.payload.rid === Session.get('openedRoom')) && (typeof window.document.hasFocus === 'function' ? window.document.hasFocus() : undefined)) {
			return;
		}

		if ((Meteor.user().status === 'busy') || (Meteor.settings.public.sandstorm != null)) {
			return;
		}
		/* globals getAvatarAsPng*/
		return getAvatarAsPng(notification.payload.sender.username, function(avatarAsPng) {
			notification.icon = avatarAsPng;
			return KonchatNotification.notify(notification);
		});
	},

	newMessage(rid) {
		if (!Session.equals(`user_${ Meteor.userId() }_status`, 'busy')) {
			const user = Meteor.user();
			const newMessageNotification = user && user.settings && user.settings.preferences && user.settings.preferences.newMessageNotification || 'chime';
			const audioVolume = user && user.settings && user.settings.preferences && user.settings.preferences.notificationsSoundVolume || 100;

			const sub = ChatSubscription.findOne({ rid }, { fields: { audioNotificationValue: 1 } });

			if (sub && sub.audioNotificationValue !== 'none') {
				if (sub && sub.audioNotificationValue) {
					const [audio] = $(`audio#${ sub.audioNotificationValue }`);
					if (audio && audio.play) {
						audio.volume = Number((audioVolume/100).toPrecision(2));
						return audio.play();
					}
				} else if (newMessageNotification !== 'none') {
					const [audio] = $(`audio#${ newMessageNotification }`);
					if (audio && audio.play) {
						audio.volume = Number((audioVolume/100).toPrecision(2));
						return audio.play();
					}
				}
			}
		}
	},

	newRoom(rid/*, withSound = true*/) {
		Tracker.nonreactive(function() {
			let newRoomSound = Session.get('newRoomSound');
			if (newRoomSound != null) {
				newRoomSound = _.union(newRoomSound, rid);
			} else {
				newRoomSound = [rid];
			}

			return Session.set('newRoomSound', newRoomSound);
		});
	},

	// $('.link-room-' + rid).addClass('new-room-highlight')

	removeRoomNotification(rid) {
		Tracker.nonreactive(() => Session.set('newRoomSound', []));

		return $(`.link-room-${ rid }`).removeClass('new-room-highlight');
	}
};

Meteor.startup(() => {
	Tracker.autorun(function() {
		const user = RocketChat.models.Users.findOne(Meteor.userId(), {
			fields: {
				'settings.preferences.newRoomNotification': 1,
				'settings.preferences.notificationsSoundVolume': 1
			}
		});
		const newRoomNotification = user && user.settings && user.settings.preferences && user.settings.preferences.newRoomNotification || 'door';
		const audioVolume = user && user.settings && user.settings.preferences && user.settings.preferences.notificationsSoundVolume || 100;

		if ((Session.get('newRoomSound') || []).length > 0) {
			Meteor.defer(function() {
				if (newRoomNotification !== 'none') {
					const [audio] = $(`audio#${ newRoomNotification }`);
					if (audio && audio.play) {
						audio.volume = Number((audioVolume/100).toPrecision(2));
						return audio.play();
					}
				}
			});
		} else {
			const [room] = $(`audio#${ newRoomNotification }`);
			if (!room) {
				return;
			}
			if (room.pause) {
				room.pause();
				return room.currentTime = 0;
			}
		}
	});
});
export { KonchatNotification };
this.KonchatNotification = KonchatNotification;
