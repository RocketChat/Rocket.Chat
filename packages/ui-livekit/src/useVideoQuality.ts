import type { VideoQuality } from '@rocket.chat/ui-conference';
import { useVideoQualityPreference } from '@rocket.chat/ui-conference';
import type { LocalVideoTrack, VideoCaptureOptions } from 'livekit-client';
import { VideoPresets } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * What each choice asks the camera for. `auto` asks for nothing and lets the camera and the connection decide.
 *
 * LiveKit's own presets, so the frame rates that go with each size come along too rather than being invented here.
 */
const PRESETS: Record<Exclude<VideoQuality, 'auto'>, VideoCaptureOptions> = {
	h1080: { resolution: VideoPresets.h1080.resolution },
	h720: { resolution: VideoPresets.h720.resolution },
	h360: { resolution: VideoPresets.h360.resolution },
	h180: { resolution: VideoPresets.h180.resolution },
};

/** Offered highest first, the way a "maximum" list reads, with `auto` at the top as the choice not to choose. */
const ORDER: VideoQuality[] = ['auto', 'h1080', 'h720', 'h360', 'h180'];

/**
 * The most detail to send. A camera's default is often far below what it can do, while more costs bandwidth and,
 * with background blur on, compositing work on every frame.
 *
 * Changing it restarts the track, a visible flicker: resolution is a property of the capture.
 */
export const useVideoQuality = (videoTrack: LocalVideoTrack | undefined) => {
	const { videoQuality: preferred, selectVideoQuality } = useVideoQualityPreference();

	const trackRef = useRef<LocalVideoTrack | undefined>(videoTrack);
	trackRef.current = videoTrack;

	const [quality, setQuality] = useState<VideoQuality>(preferred);
	const [pending, setPending] = useState(false);

	// What the camera is actually giving. Reported rather than assumed: asking for 1080p is not the same as getting
	// it, and a camera that cannot manage it hands back whatever it has without complaint.
	const [height, setHeight] = useState<number | undefined>();
	useEffect(() => {
		setHeight(videoTrack?.mediaStreamTrack?.getSettings?.().height);
	}, [videoTrack, videoTrack?.mediaStreamTrack, quality, pending]);

	const select = useCallback(
		(next: VideoQuality) => {
			const track = trackRef.current;
			if (!track || pending || next === quality) {
				return;
			}

			selectVideoQuality(next);
			setPending(true);

			// `auto` restarts with no size asked for, which drops the ceiling rather than pinning the camera to
			// whatever it happened to be doing.
			void track
				.restartTrack(next === 'auto' ? {} : PRESETS[next])
				.then(() => setQuality(next))
				.catch((err: unknown) => console.warn('the camera would not change resolution', err))
				.finally(() => setPending(false));
		},
		[quality, pending, selectVideoQuality],
	);

	return useMemo(
		() => ({
			quality,
			qualities: ORDER,
			/** The height actually being captured, for saying so beside the choice. */
			height,
			pending,
			select,
		}),
		[quality, height, pending, select],
	);
};
