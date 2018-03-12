/* globals popout */

this.popout = {
	context: null,
	isAudioOnly: false,
	showVideoControls: true,
	showStreamControls: false,
	x: 0,
	y: 0,
	open(config = {}, fn) {
		this.close();
		this.context = Blaze.renderWithData(Template.popout, config, document.body);
		this.fn = fn;
		this.config = config;
		this.onCloseCallback = config.onCloseCallback || null;
		this.timer = null;
		if (config.timer) {
			this.timer = setTimeout(() => this.close(), config.timer);
		}
		if (config.data) {
			this.isAudioOnly = config.data.isAudioOnly;
			this.showVideoControls = config.data.showVideoControls;
			this.showStreamControls = config.data.showStreamControls;
		}
	},
	close() {
		if (this.context) {
			Blaze.remove(this.context);
		}
		this.context = null;
		this.fn = null;
		if (this.timer) {
			clearTimeout(this.timer);
		}
		if (typeof(this.onCloseCallback) === 'function') {
			this.onCloseCallback();
		}
	},
	dragstart(event) {
		if (!event.target.classList.contains('dropzone-overlay')) {
			const popoutElement = document.querySelector('.rc-popout-wrapper');
			setTimeout(function() {
				popoutElement.style.display = 'none';
			}, 0);
		}
	},
	dragover(event) {
		const e = event.originalEvent || event;
		e.dataTransfer.dropEffect = 'move';
		e.preventDefault();
	},
	dragend(event) {
		if (!event.target.classList.contains('dropzone-overlay')) {
			const popoutElement = document.querySelector('.rc-popout-wrapper');
			popoutElement.style.display = 'initial';
		}
	},
	drop(event) {
		const e = event.originalEvent || event;
		e.preventDefault();
		// do not mess with the position if we are dropping files in the dropzone
		if (!event.target.classList.contains('dropzone-overlay')) {
			const popoutElement = document.querySelector('.rc-popout-wrapper');
			const positionTop = e.clientY - popout.y;
			const positionLeft = e.clientX - popout.x;
			popoutElement.style.left = `${ positionLeft >= 0 ? positionLeft : 0 }px`;
			popoutElement.style.top = `${ positionTop >= 0 ? positionTop : 0 }px`;
		}
	}
};

Template.popout.helpers({
	state() {
		return Template.instance().isMinimized.get() ? 'closed' : 'open';
	},
	isAudioOnly() {
		return Template.instance().isAudioOnly.get();
	},
	isMuted() {
		return Template.instance().isMuted.get();
	},
	isPlaying() {
		return Template.instance().isPlaying.get();
	},
	showVideoControls() {
		return Template.instance().showVideoControls.get();
	},
	showStreamControls() {
		return Template.instance().showStreamControls.get();
	},
	getStreamStatus() {
		return Template.instance().streamStatus.get();
	}
});

Template.popout.onRendered(function() {
	Template.instance().isMinimized.set(popout.isAudioOnly);
	Template.instance().isAudioOnly.set(popout.isAudioOnly);
	Template.instance().showVideoControls.set(popout.showVideoControls);
	Template.instance().showStreamControls.set(popout.showStreamControls);


	if (this.data.onRendered) {
		this.data.onRendered();
	}
});
Template.popout.onCreated(function() {
	this.isMinimized = new ReactiveVar(popout.isAudioOnly);
	this.isAudioOnly = new ReactiveVar(popout.isAudioOnly);
	this.canOpenExternal = new ReactiveVar(popout.canOpenExternal);
	this.showVideoControls = new ReactiveVar(popout.showVideoControls);
	this.showStreamControls = new ReactiveVar(popout.showStreamControls);

	this.isMuted = new ReactiveVar(false);
	this.isPlaying = new ReactiveVar(true);
	this.streamStatus = new ReactiveVar('loading');
	document.body.addEventListener('dragstart', popout.dragstart, true);
	document.body.addEventListener('dragover', popout.dragover, true);
	document.body.addEventListener('dragend', popout.dragend, true);
	document.body.addEventListener('drop', popout.drop, true);
});

Template.popout.onDestroyed(function() {
	popout.context = null;
	document.body.removeEventListener('dragstart', popout.dragstart, true);
	document.body.removeEventListener('dragover', popout.dragover, true);
	document.body.removeEventListener('dragend', popout.dragend, true);
	document.body.removeEventListener('drop', popout.drop, true);
});

Template.popout.events({
	'click .js-action'(e, instance) {
		!this.action || this.action.call(instance.data.data, e, instance);
		e.stopPropagation();
		popout.close();
	},
	'click .js-close'(e) {
		e.stopPropagation();
		popout.close();
	},
	'click .js-minimize'(e, i) {
		e.stopPropagation();
		if (i.isMinimized.get()) {
			i.isMinimized.set(false);
			window.liveStreamPlayer.setSize(380, 214);
		} else {
			i.isMinimized.set(true);
			window.liveStreamPlayer.setSize(0, 0);
		}
	},
	'dragstart .rc-popout-wrapper'(event) {
		const e = event.originalEvent || event;
		const url = (this.data && this.data.streamingSource) || '.rc-popout-wrapper';
		popout.x = e.offsetX;
		popout.y = e.offsetY;
		e.dataTransfer.setData('application/x-moz-node', e.currentTarget);
		e.dataTransfer.setData('text/plain', url);
		e.dataTransfer.effectAllowed = 'move';
	},
	'dragend .rc-popout-wrapper'(event) {
		event.preventDefault();
	},
	'click .rc-popout__controls--record'(e, i) {
		e.preventDefault();
		document.querySelector('.streaming-popup').dispatchEvent(new Event('startStreaming'));
		i.streamStatus.set('starting');
	},
	'broadcastStreamReady .streaming-popup'(e, i) {
		e.preventDefault();
		i.streamStatus.set('ready');
	},
	'broadcastStream .streaming-popup'(e, i) {
		e.preventDefault();
		i.streamStatus.set('recording');
	},
	'click .rc-popout__controls--play'(e, i) {
		window.liveStreamPlayer.playVideo();
		i.isPlaying.set(true);
	},
	'click .rc-popout__controls--pause'(e, i) {
		window.liveStreamPlayer.pauseVideo();
		i.isPlaying.set(false);
	},
	'click .rc-popout__controls--mute'(e, i) {
		window.liveStreamPlayer.mute();
		i.isMuted.set(true);
	},
	'click .rc-popout__controls--unmute'(e, i) {
		window.liveStreamPlayer.unMute();
		i.isMuted.set(false);
	},
	'playerStateChanged .rc-popout'(e, i) {
		if (e.detail === window.YT.PlayerState.PLAYING) {
			i.isPlaying.set(true);
		} else if (e.detail === window.YT.PlayerState.PAUSED) {
			i.isPlaying.set(false);
		}
	}
});

RocketChat.callbacks.add('afterLogoutCleanUp', () => popout.close(), RocketChat.callbacks.priority.MEDIUM, 'popout-close-after-logout-cleanup');
