/* globals WebRTC */
Template.videoCall.onCreated(function() {
	return this.mainVideo = new ReactiveVar('$auto');
});

Template.videoCall.helpers({
	videoAvaliable() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')) != null;
	},
	videoActive() {
		const webrtc = WebRTC.getInstanceByRoomId(Session.get('openedRoom'));
		const overlay = this.overlay != null;
		if (overlay !== (webrtc != null ? webrtc.overlayEnabled.get() : null)) {
			return false;
		}
		let { remoteItems } = webrtc;
		const { localUrl } = webrtc;
		remoteItems = remoteItems.get() || [];
		return (localUrl.get() != null) || remoteItems.length > 0;
	},
	callInProgress() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).callInProgress.get();
	},
	overlayEnabled() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).overlayEnabled.get();
	},
	audioEnabled() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).audioEnabled.get();
	},
	videoEnabled() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).videoEnabled.get();
	},
	audioAndVideoEnabled() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).audioEnabled.get() && WebRTC.getInstanceByRoomId(Session.get('openedRoom')).videoEnabled.get();
	},
	screenShareAvailable() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).screenShareAvailable;
	},
	screenShareEnabled() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).screenShareEnabled.get();
	},
	remoteVideoItems() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).remoteItems.get();
	},
	selfVideoUrl() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).localUrl.get();
	},
	mainVideoUrl() {
		const template = Template.instance();
		const webrtc = WebRTC.getInstanceByRoomId(Session.get('openedRoom'));
		if (template.mainVideo.get() === '$self') {
			return webrtc.localUrl.get();
		}
		if (template.mainVideo.get() === '$auto') {
			const remoteItems = webrtc.remoteItems.get() | [];
			if (remoteItems.length > 0) {
				return remoteItems[0].url;
			}
			return webrtc.localUrl.get();
		}
		if (webrtc.remoteItemsById.get()[template.mainVideo.get()] != null) {
			return webrtc.remoteItemsById.get()[template.mainVideo.get()].url;
		} else {
			template.mainVideo.set('$auto');
		}
	},
	mainVideoUsername() {
		const template = Template.instance();
		const webrtc = WebRTC.getInstanceByRoomId(Session.get('openedRoom'));
		if (template.mainVideo.get() === '$self') {
			return t('you');
		}
		if (template.mainVideo.get() === '$auto') {
			const remoteItems = webrtc.remoteItems.get() || [];
			if (remoteItems.length > 0) {
				const user = Meteor.users.findOne(remoteItems[0].id);
				return user != null ? user.username : undefined;
			}
			return t('you');
		}
		if (webrtc.remoteItemsById.get()[template.mainVideo.get()] != null) {
			const user = Meteor.users.findOne(webrtc.remoteItemsById.get()[template.mainVideo.get()].id);
			return user != null ? user.username : undefined;
		} else {
			template.mainVideo.set('$auto');
		}
	},
	usernameByUserId(userId) {
		const user = Meteor.users.findOne(userId);
		return user != null ? user.username : undefined;
	}
});

Template.videoCall.events({
	'click .stop-call'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).stop();
	},
	'click .video-item'(e, t) {
		return t.mainVideo.set($(e.currentTarget).data('username'));
	},
	'click .disable-audio'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).disableAudio();
	},
	'click .enable-audio'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).enableAudio();
	},
	'click .disable-video'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).disableVideo();
	},
	'click .enable-video'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).enableVideo();
	},
	'click .disable-screen-share'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).disableScreenShare();
	},
	'click .enable-screen-share'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).enableScreenShare();
	},
	'click .disable-overlay'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).overlayEnabled.set(false);
	},
	'click .enable-overlay'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).overlayEnabled.set(true);
	},
	'loadstart video[muted]'(e) {
		e.currentTarget.muted = true;
		return e.currentTarget.volume = 0;
	}
});
