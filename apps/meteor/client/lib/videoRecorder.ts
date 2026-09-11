import { Emitter } from '@rocket.chat/emitter';
import { useCallback, useSyncExternalStore } from 'react';

type VideoRecorderEvents = {
	cameraStartedChange: boolean;
};

class VideoRecorder extends Emitter<VideoRecorderEvents> {
	private _cameraStarted = false;

	private started = false;

	private recordingAvailable = false;

	private videoel: HTMLVideoElement | undefined;

	private chunks: Blob[] = [];

	private stream: MediaStream | undefined;

	private mediaRecorder: MediaRecorder | undefined;

	private sessionId = 0;

	public get cameraStarted(): boolean {
		return this._cameraStarted;
	}

	private setCameraStarted(value: boolean) {
		if (this._cameraStarted === value) {
			return;
		}
		this._cameraStarted = value;
		this.emit('cameraStartedChange', value);
	}

	public getSupportedMimeTypes() {
		if (window.MediaRecorder.isTypeSupported('video/webm')) {
			return 'video/webm; codecs=vp8,opus';
		}
		if (window.MediaRecorder.isTypeSupported('video/mp4')) {
			return 'video/mp4';
		}
		return '';
	}

	public start(videoel?: HTMLVideoElement, cb?: (this: this, success: boolean) => void) {
		this.videoel = videoel;
		const currentSessionId = ++this.sessionId;

		const handleSuccess = (stream: MediaStream) => {
			if (this.isStaleSession(currentSessionId)) {
				this.stopStreamTracks(stream);
				return;
			}
			this.startUserMedia(stream);
			cb?.call(this, true);
		};

		const handleError = (error: any) => {
			console.error(error);
			cb?.call(this, false);
		};

		if (navigator.mediaDevices) {
			navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(handleSuccess, handleError);
			return;
		}

		const oldGetUserMedia = navigator.getUserMedia ?? navigator.webkitGetUserMedia ?? navigator.mozGetUserMedia ?? navigator.msGetUserMedia;

		if (oldGetUserMedia) {
			oldGetUserMedia.call(navigator, { audio: true, video: true }, handleSuccess, handleError);
			return;
		}

		cb?.call(this, false);
	}

	public record() {
		this.chunks = [];
		if (!this.stream) {
			return;
		}

		this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: this.getSupportedMimeTypes() });
		this.mediaRecorder.ondataavailable = (blobev) => {
			this.chunks.push(blobev.data);
			if (!this.recordingAvailable) {
				this.recordingAvailable = true;
			}
		};
		this.mediaRecorder.start();
	}

	private stopStreamTracks(stream: MediaStream) {
		const vtracks = stream.getVideoTracks();
		for (const vtrack of Array.from(vtracks)) {
			vtrack.stop();
		}

		const atracks = stream.getAudioTracks();
		for (const atrack of Array.from(atracks)) {
			atrack.stop();
		}
	}

	private isStaleSession(sessionId: number): boolean {
		return this.sessionId !== sessionId;
	}

	private startUserMedia(stream: MediaStream) {
		if (!this.videoel) {
			return;
		}
		this.stream = stream;

		try {
			this.videoel.srcObject = stream;
		} catch (error) {
			const URL = window.URL || window.webkitURL;
			this.videoel.src = URL.createObjectURL(stream as unknown as MediaSource | Blob);
		}

		this.started = true;
		this.setCameraStarted(true);
	}

	public stop(cb?: (blob: Blob) => void) {
		this.sessionId++;

		this.stopRecording();

		if (this.stream) {
			this.stopStreamTracks(this.stream);
		}

		if (this.videoel) {
			this.videoel.pause();
			this.videoel.src = '';
		}

		const wasStarted = this.started;
		this.started = false;
		this.setCameraStarted(false);
		this.recordingAvailable = false;

		if (cb && this.chunks && wasStarted) {
			const blob = new Blob(this.chunks);
			cb(blob);
		}

		delete this.stream;
		delete this.videoel;
	}

	public stopRecording() {
		if (!this.started || !this.mediaRecorder) {
			return;
		}

		this.mediaRecorder.stop();
		delete this.mediaRecorder;
	}
}

const instance = new VideoRecorder();

export { instance as VideoRecorder };

export const useVideoRecorderCameraStarted = (): boolean =>
	useSyncExternalStore(
		useCallback((onStoreChange) => instance.on('cameraStartedChange', onStoreChange), []),
		() => instance.cameraStarted,
	);
