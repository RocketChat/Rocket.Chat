
this.onYouTubePlayerAPIReady = function() {
	const playerReadyEvent = new Event('playerReady');
	document.querySelector('.streaming-popup').dispatchEvent(playerReadyEvent);
};
this.liveStreamPlayer = null;

Template.liveStreamView.onCreated(function() {
	this.streamingOptions = new ReactiveVar(this.data.streamingOptions);
});

Template.liveStreamView.onRendered(function() {
	if (window.YT) {
		window.liveStreamPlayer = new window.YT.Player('ytplayer', {
			width: '380',
			height: '214',
			videoId: this.data.streamingOptions.id || '',
			playerVars: {
				autoplay: 1,
				controls: 0,
				showinfo: 0,
				enablejsapi: 1,
				fs: 0,
				modestbranding: 1,
				rel: 0
			},
			events: {
				'onStateChange': (e) => {
					const playerStateChangedEvent = new CustomEvent('playerStateChanged', {detail: e.data});
					document.querySelector('.rc-popout').dispatchEvent(playerStateChangedEvent);
				}
			}
		});
	} else {
		const tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/player_api';
		tag.type = 'text/javascript';
		const firstScriptTag = document.body.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	}
});

Template.liveStreamView.events({
	'playerReady .streaming-popup'(e, i) {
		window.liveStreamPlayer = new window.YT.Player('ytplayer', {
			width: '380',
			height: '214',
			videoId: i.streamingOptions.get().id || '',
			playerVars: {
				autoplay: 1,
				controls: 0,
				showinfo: 0,
				enablejsapi: 1,
				fs: 0,
				modestbranding: 1,
				rel: 0
			},
			events: {
				'onStateChange': (e) => {
					const playerStateChangedEvent = new CustomEvent('playerStateChanged', {detail: e.data});
					document.querySelector('.rc-popout').dispatchEvent(playerStateChangedEvent);
				}
			}
		});
	}
});
