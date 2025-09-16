import { Stream } from './Stream';
import type { IMediaSignalLogger } from '../../../definition';

export class LocalStream extends Stream {
	private audioTransceiver: RTCRtpTransceiver;

	constructor(mediaStream: MediaStream, peer: RTCPeerConnection, logger?: IMediaSignalLogger) {
		super(mediaStream, peer, logger);
		// Ensures the peer will always have an audio transceiver, even if we have no audio track yet
		this.audioTransceiver = this.peer.addTransceiver('audio', { direction: 'sendrecv' });
	}

	public async setTrack(newTrack: MediaStreamTrack | null): Promise<void> {
		if (newTrack && newTrack?.kind !== 'audio') {
			return;
		}
		this.logger?.debug('LocalStream.setTrack');

		if (newTrack) {
			if (!this.setAudioTrack(newTrack)) {
				return;
			}
		} else {
			this.removeAudioTracks();
		}

		this.logger?.debug('LocalStream.setRemoteTrack');
		await this.audioTransceiver.sender.replaceTrack(newTrack);
	}
}
