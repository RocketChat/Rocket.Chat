/** Test-only levers a fake track exposes on top of the MediaStreamTrack surface. */
export interface FakeTrackControls {
	/** Raises the 'mute' event a browser raises when the source stops delivering media. */
	simulateMute(): void;
	simulateUnmute(): void;
	/** Raises the 'ended' event a browser raises when the source disappears. */
	simulateEnded(): void;
	/** True once the code under test called stop() on this track. */
	readonly stopped: boolean;
	/** The id of the track this one mirrors, for tracks a fake peer connection received. */
	readonly sourceTrackId: string | null;
}

export type FakeMediaStreamTrack = MediaStreamTrack & FakeTrackControls;

export type FakeTrackOptions = {
	deviceId?: string;
	label?: string;
	sourceTrackId?: string;
};

let trackCount = 0;

class FakeTrack extends EventTarget {
	public readonly id: string;

	public readonly kind: 'audio' | 'video';

	public readonly label: string;

	public readonly sourceTrackId: string | null;

	public enabled = true;

	public muted = false;

	public contentHint = '';

	public readyState: MediaStreamTrackState = 'live';

	public onended: ((this: MediaStreamTrack, event: Event) => any) | null = null;

	public onmute: ((this: MediaStreamTrack, event: Event) => any) | null = null;

	public onunmute: ((this: MediaStreamTrack, event: Event) => any) | null = null;

	private _stopped = false;

	private readonly settings: MediaTrackSettings;

	public get stopped(): boolean {
		return this._stopped;
	}

	constructor(kind: 'audio' | 'video', options: FakeTrackOptions = {}) {
		super();
		trackCount++;

		this.id = `fake-${kind}-track-${trackCount}`;
		this.kind = kind;
		this.label = options.label || `${kind} (fake)`;
		this.sourceTrackId = options.sourceTrackId || null;
		this.settings = { deviceId: options.deviceId || 'default' };
	}

	public getSettings(): MediaTrackSettings {
		return { ...this.settings };
	}

	public getConstraints(): MediaTrackConstraints {
		return {};
	}

	public getCapabilities(): MediaTrackCapabilities {
		return {};
	}

	public async applyConstraints(): Promise<void> {
		return undefined;
	}

	public clone(): FakeMediaStreamTrack {
		return createFakeTrack(this.kind, { deviceId: this.settings.deviceId as string, label: this.label });
	}

	public stop(): void {
		this._stopped = true;
		this.setReadyState('ended');
	}

	public simulateMute(): void {
		if (this.muted || this.readyState === 'ended') {
			return;
		}

		this.muted = true;
		this.dispatch('mute');
	}

	public simulateUnmute(): void {
		if (!this.muted || this.readyState === 'ended') {
			return;
		}

		this.muted = false;
		this.dispatch('unmute');
	}

	public simulateEnded(): void {
		this.setReadyState('ended');
	}

	private setReadyState(readyState: MediaStreamTrackState): void {
		if (this.readyState === readyState) {
			return;
		}

		this.readyState = readyState;
		if (readyState === 'ended') {
			this.dispatch('ended');
		}
	}

	private dispatch(type: 'mute' | 'unmute' | 'ended'): void {
		const event = new Event(type);

		this.dispatchEvent(event);

		const handlers = { mute: this.onmute, unmute: this.onunmute, ended: this.onended };
		handlers[type]?.call(this as unknown as MediaStreamTrack, event);
	}
}

export const createFakeTrack = (kind: 'audio' | 'video', options: FakeTrackOptions = {}): FakeMediaStreamTrack =>
	new FakeTrack(kind, options) as unknown as FakeMediaStreamTrack;

export const asFakeTrack = (track: MediaStreamTrack | null | undefined): FakeMediaStreamTrack => {
	if (!(track instanceof FakeTrack)) {
		throw new Error('The track was not created by the media signaling harness.');
	}

	return track as unknown as FakeMediaStreamTrack;
};

export const resetFakeTrackIds = (): void => {
	trackCount = 0;
};
