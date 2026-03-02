import { Emitter } from '@rocket.chat/emitter';

/**
 * As a workaround for a chrome bug, we use a delay to ignore any 'mute' events that are immediately followed by an 'unmute' event.
 * */
const MUTE_DELAY = 500;
const ENDED_INTERVAL = 100;

export type MediaStreamTrackEvents = {
	mute: void;
	unmute: void;
	ended: void;
};

export class MediaStreamTrackWrapper {
	/**
	 * muted is a flag that determines if the track has media coming in
	 */
	public get muted(): boolean {
		return this.muteTriggered;
	}

	public get ended(): boolean {
		return this.endedTriggered || this.track.readyState === 'ended';
	}

	/**
	 * enabled is a flag that determines if the rocket.chat client wants this track to be enabled
	 * */
	public get enabled(): boolean {
		return this.track.enabled;
	}

	public set enabled(value: boolean) {
		this.track.enabled = value;
	}

	public readonly emitter: Emitter<MediaStreamTrackEvents>;

	private muteTriggered = false;

	private endedTriggered = false;

	private muteTimeoutHandler: ReturnType<typeof setTimeout> | null = null;

	private endedIntervalHandler: ReturnType<typeof setInterval> | null = null;

	constructor(public readonly track: MediaStreamTrack) {
		this.emitter = new Emitter();
		this.muteTriggered = track.muted ?? false;
		this.configureEvents();

		this.endedIntervalHandler = setInterval(() => {
			if (this.endedTriggered || this.track.readyState !== 'ended') {
				return;
			}

			this.setEnded();
		}, ENDED_INTERVAL);
	}

	private setMuted(muted: boolean) {
		if (this.endedTriggered || this.muteTriggered === muted) {
			return;
		}

		this.muteTriggered = muted;
		if (muted) {
			this.emitter.emit('mute');
		} else {
			this.emitter.emit('unmute');
		}
	}

	private setEnded() {
		this.clearEndedInterval();

		if (this.endedTriggered) {
			return;
		}

		this.clearMuteTimeout();
		this.endedTriggered = true;
		this.emitter.emit('ended');
	}

	configureEvents() {
		this.track.addEventListener('mute', () => {
			this.clearMuteTimeout();

			this.muteTimeoutHandler = setTimeout(() => {
				this.setMuted(true);
			}, MUTE_DELAY);
		});

		this.track.addEventListener('unmute', () => {
			this.clearMuteTimeout();

			if (this.muteTriggered) {
				this.setMuted(false);
			}
		});

		this.track.addEventListener('ended', () => {
			this.setEnded();
		});
	}

	clearMuteTimeout() {
		if (!this.muteTimeoutHandler) {
			return;
		}

		clearTimeout(this.muteTimeoutHandler);
		this.muteTimeoutHandler = null;
	}

	clearEndedInterval() {
		if (!this.endedIntervalHandler) {
			return;
		}

		clearInterval(this.endedIntervalHandler);
		this.endedIntervalHandler = null;
	}
}
