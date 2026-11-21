import type { LocalParticipant, Room } from 'livekit-client';
import { Track, createLocalVideoTrack } from 'livekit-client';

import { EffectProcessor, attachProcessor, forgetProcessor } from './effectProcessor';
import type { BackgroundEffectControl } from './useBackgroundEffect';

/**
 * Publishes the camera only after its effect has produced a frame, so nobody receives an unprocessed one. A muted
 * camera is replaced rather than unmuted, since a fresh processor's first frame would go out bare.
 */
export const publishCameraWithEffect = async (
	room: Room,
	localParticipant: LocalParticipant,
	background: BackgroundEffectControl,
	deviceId: string | undefined,
) => {
	const capture = room.options.videoCaptureDefaults;
	const frameHeight = typeof capture?.resolution?.height === 'number' ? capture.resolution.height : 720;
	const effectProcessor = await EffectProcessor.create(background.wanted, await background.sourceFor(frameHeight));
	const track = await createLocalVideoTrack({ ...capture, ...(deviceId && { deviceId }), processor: effectProcessor.processor });
	attachProcessor(track, effectProcessor);
	try {
		await effectProcessor.nextFrame();
	} catch (err) {
		forgetProcessor(track);
		track.stop();
		throw err;
	}

	const previous = localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
	if (previous) {
		await localParticipant.unpublishTrack(previous, true);
	}
	await localParticipant.publishTrack(track, { source: Track.Source.Camera });
};
