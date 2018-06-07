/* globals Push Servers*/
if (Meteor.isCordova) {
	// Push.addListener 'token', (token) ->
	// 	Meteor.call 'log', 'CLIENT', 'token', arguments

	// Push.addListener 'error', (err) ->
	// 	Meteor.call 'log', 'CLIENT', 'error', arguments
	// 	if err.type == 'apn.cordova'
	// 		Meteor.call 'log', 'CLIENT', err.error

	// Push.addListener 'register', (evt) ->
	// 	Meteor.call 'log', 'CLIENT', 'register', arguments

	// Push.addListener 'alert', (notification) ->
	// 	Meteor.call 'log', 'CLIENT', 'alert', arguments

	// Push.addListener 'sound', (notification) ->
	// 	Meteor.call 'log', 'CLIENT', 'sound', arguments

	// Push.addListener 'badge', (notification) ->
	// 	Meteor.call 'log', 'CLIENT', 'badge', arguments

	// Push.addListener 'message', (notification) ->
	// 	Meteor.call 'log', 'CLIENT', 'message', arguments

	Push.addListener('startup', function(notification) {
		// Meteor.call 'log', 'CLIENT', 'startup', arguments

		if (notification.payload && notification.payload.rid) {
			if (notification.payload.host === Meteor.absoluteUrl()) {
				switch (notification.payload.type) {
					case 'c':
						return FlowRouter.go('channel', { name: notification.payload.name }, FlowRouter.current().queryParams);
					case 'p':
						return FlowRouter.go('group', { name: notification.payload.name }, FlowRouter.current().queryParams);
					case 'd':
						return FlowRouter.go('direct', { username: notification.payload.sender.username }, FlowRouter.current().queryParams);
				}
			} else {
				let path = '';
				switch (notification.payload.type) {
					case 'c':
						path = `channel/${ notification.payload.name }`;
						break;
					case 'p':
						path = `group/${ notification.payload.name }`;
						break;
					case 'd':
						path = `direct/${ notification.payload.sender.username }`;
						break;
				}

				const host = notification.payload.host.replace(/\/$/, '');
				if (Servers.serverExists(host) !== true) {
					return;
				}

				return Servers.startServer(host, path, function(err) {
					if (err) {
						// TODO err
						return console.log(err);
					}
				});
			}
		}
	});


	Meteor.startup(() =>
		Tracker.autorun(() => {
			if (RocketChat.settings.get('Push_enable') === true) {

				Push.Configure({
					android: {
						senderID: window.ANDROID_SENDER_ID,
						sound: true,
						vibrate: true
					},
					ios: {
						badge: true,
						clearBadge: true,
						sound: true,
						alert: true
					}
				});
			}
		})
	);
}
