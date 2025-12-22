import { Stream } from './Stream';

export class RemoteStream extends Stream {
	public setAudioTrack(newTrack: MediaStreamTrack): boolean {
		if (newTrack.kind !== 'audio') {
			return false;
		}

		this.logger?.debug('Stream.setAudioTrack', newTrack.id);
		const matchingTrack = this.mediaStream.getTrackById(newTrack.id);
		if (matchingTrack) {
			this.logger?.debug('Stream.setAudioTrack.return', 'track found by id');
			return false;
		}

		this.removeTracks('audio');
		this.mediaStream.addTrack(newTrack);
		return true;
	}

	public setVideoTrack(newTrack: MediaStreamTrack): boolean {
		if (newTrack.kind !== 'video') {
			return false;
		}

		this.logger?.debug('Stream.setVideoTrack', newTrack.id);
		const matchingTrack = this.mediaStream.getTrackById(newTrack.id);
		if (matchingTrack) {
			this.logger?.debug('Stream.setVideoTrack.return', 'track found by id');
			return false;
		}

		this.removeTracks('video');
		this.mediaStream.addTrack(newTrack);
		return true;
	}
}
