/* globals WebRTC */
Template.videoButtons.helpers({
	videoAvaliable() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')) != null;
	},
	videoActive() {
		const {localUrl, remoteItems} = WebRTC.getInstanceByRoomId(Session.get('openedRoom'));
		const r = remoteItems.get() || [];
		return localUrl.get() != null || r.length > 0;
	},
	callInProgress() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).callInProgress.get();
	}
});

Template.videoButtons.events({
	'click .start-video-call'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({
			audio: true,
			video: true
		});
	},
	'click .start-audio-call'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({
			audio: true
		});
	},
	'click .join-video-call'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({
			audio: true,
			video: true
		});
	},
	'click .join-audio-call'() {
		return WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({
			audio: true
		});
	}
});
