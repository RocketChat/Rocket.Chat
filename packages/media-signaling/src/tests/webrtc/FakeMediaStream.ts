import { createFakeTrack } from './FakeMediaStreamTrack';

let streamCount = 0;

class FakeStream extends EventTarget {
	public readonly id: string;

	public onaddtrack: ((this: MediaStream, event: MediaStreamTrackEvent) => any) | null = null;

	public onremovetrack: ((this: MediaStream, event: MediaStreamTrackEvent) => any) | null = null;

	private tracks: MediaStreamTrack[] = [];

	public get active(): boolean {
		return this.tracks.some((track) => track.readyState === 'live');
	}

	constructor(tracks: MediaStreamTrack[] = [], id?: string) {
		super();
		streamCount++;

		this.id = id || `fake-stream-${streamCount}`;
		this.tracks = [...tracks];
	}

	public addTrack(track: MediaStreamTrack): void {
		if (this.tracks.includes(track)) {
			return;
		}

		this.tracks.push(track);
	}

	public removeTrack(track: MediaStreamTrack): void {
		this.tracks = this.tracks.filter((current) => current !== track);
	}

	public getTracks(): MediaStreamTrack[] {
		return [...this.tracks];
	}

	public getAudioTracks(): MediaStreamTrack[] {
		return this.tracks.filter((track) => track.kind === 'audio');
	}

	public getVideoTracks(): MediaStreamTrack[] {
		return this.tracks.filter((track) => track.kind === 'video');
	}

	public getTrackById(id: string): MediaStreamTrack | null {
		return this.tracks.find((track) => track.id === id) || null;
	}

	public clone(): MediaStream {
		return new FakeStream(this.getTracks()) as unknown as MediaStream;
	}
}

export const createFakeStream = (tracks: MediaStreamTrack[] = [], id?: string): MediaStream =>
	new FakeStream(tracks, id) as unknown as MediaStream;

export const createFakeAudioStream = (options: { deviceId?: string } = {}): MediaStream =>
	createFakeStream([createFakeTrack('audio', options)]);

export const createFakeDisplayStream = (): MediaStream => createFakeStream([createFakeTrack('video', { label: 'screen (fake)' })]);

export const FakeMediaStream = FakeStream as unknown as typeof MediaStream;

export const resetFakeStreamIds = (): void => {
	streamCount = 0;
};
