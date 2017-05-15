/* globals LivechatVideoCall, cordova, JitsiMeetExternalAPI */

LivechatVideoCall = new (class LivechatVideoCall {
	constructor() {
		this.live = new ReactiveVar(false);
		this.calling = new ReactiveVar(false);

		if (typeof JitsiMeetExternalAPI === 'undefined') {
			const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
			$.getScript(`${ prefix }/packages/rocketchat_videobridge/client/public/external_api.js`);
		}
	}

	askPermissions(callback) {
		if (Meteor.isCordova) {
			cordova.plugins.diagnostic.requestCameraAuthorization(() => {
				cordova.plugins.diagnostic.requestMicrophoneAuthorization(() => {
					callback(true);
				}, (error) => {
					console.error(error);
				});
			}, (error) => {
				console.error(error);
			});
		} else {
			return callback(true);
		}
	}

	request() {
		this.askPermissions((granted) => {
			if (granted) {
				this.calling.set(true);
				Meteor.call('livechat:startVideoCall', visitor.getRoom(true), (error, result) => {
					if (error) {
						return;
					}
					visitor.subscribeToRoom(result.roomId);

					// after get ok from server, start the chat
					this.start(result.domain, result.jitsiRoom);
				});
			}
		});
	}

	start(domain, room) {
		Meteor.defer(() => {
			const interfaceConfig = {};
			interfaceConfig['TOOLBAR_BUTTONS'] = '[""]';
			interfaceConfig['APP_NAME'] = '"Livechat"';
			interfaceConfig['INITIAL_TOOLBAR_TIMEOUT'] = '5000';
			interfaceConfig['MIN_WIDTH'] = '300';
			interfaceConfig['FILM_STRIP_MAX_HEIGHT'] = '50';

			this.api = new JitsiMeetExternalAPI(domain, room, $('.video-call').width(), $('.video-call').height(), $('.video-call .container').get(0), {}, interfaceConfig);

			this.api.addEventListener('videoConferenceJoined', () => {
				this.api.executeCommand('toggleFilmStrip', []);
			});

			this.live.set(true);
		});
	}

	finish() {
		this.live.set(false);
		this.calling.set(false);
		this.api.dispose();
	}

	isActive() {
		return this.live.get() || this.calling.get();
	}

	isLive() {
		return this.live.get();
	}
});

/* exported LivechatVideoCall */
