import { Stream } from './Stream';

export class LocalStream extends Stream {
	public async setTrack(newTrack: MediaStreamTrack, peer: RTCPeerConnection): Promise<void> {
		if (newTrack.kind === 'video') {
			return;
		}

		if (newTrack.kind !== 'audio') {
			throw new Error('Unsupported track kind');
		}

		const sender = peer.getSenders().find((sender) => sender.track?.kind === newTrack.kind);
		if (!sender) {
			peer.addTrack(newTrack, this.mediaStream);
			this.mediaStream.addTrack(newTrack);
			return;
		}

		await sender.replaceTrack(newTrack);

		const oldTrack = this.mediaStream.getTracks().find((localTrack) => localTrack.kind === newTrack.kind);
		if (oldTrack) {
			oldTrack.stop();
			this.mediaStream.removeTrack(oldTrack);
		}

		this.mediaStream.addTrack(newTrack);
	}

	public async setStreamTracks(stream: MediaStream, peer: RTCPeerConnection): Promise<void> {
		const audioTracks = stream.getAudioTracks();
		if (audioTracks.length) {
			await this.setTrack(audioTracks[0], peer);
		}
	}
}
