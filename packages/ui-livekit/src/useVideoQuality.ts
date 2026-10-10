import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { VideoQuality, VideoQualitySelection } from '@rocket.chat/ui-conference';
import { useVideoQualityPreference } from '@rocket.chat/ui-conference';
import type { LocalVideoTrack, Room, VideoCaptureOptions } from 'livekit-client';
import { VideoPresets } from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';

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

/** What to open or restart a camera with for `quality`; `auto` asks for no size, dropping the ceiling. */
export const captureOptionsFor = (quality: VideoQuality): VideoCaptureOptions => (quality === 'auto' ? {} : PRESETS[quality]);

const warn = (err: unknown) => console.warn('the camera would not change resolution', err);

/** Offered highest first, the way a "maximum" list reads, with `auto` at the top as the choice not to choose. */
const ORDER: VideoQuality[] = ['auto', 'h1080', 'h720', 'h360', 'h180'];

/**
 * The most detail to send. A camera's default is often far below what it can do, while more costs bandwidth and,
 * with background blur on, compositing work on every frame.
 *
 * `videoTrack` is the camera while it is on, and `sentHeight` what its encoder is sending. Changing the choice then
 * restarts it, a visible flicker: resolution is a property of the capture. A choice made with the camera off is kept
 * for when it comes back on.
 */
export const useVideoQuality = (room: Room, videoTrack: LocalVideoTrack | undefined, sentHeight?: number): VideoQualitySelection => {
	const { videoQuality: quality, selectVideoQuality } = useVideoQualityPreference();
	const [pending, setPending] = useState(false);
	// The quality each track was last opened or restarted at, which a camera turned back on keeps.
	const applied = useRef<{ track: LocalVideoTrack; quality: VideoQuality } | undefined>(undefined);

	// The room opens every new camera with its capture defaults.
	useEffect(() => {
		const defaults = { ...room.options.videoCaptureDefaults };
		delete defaults.resolution;
		room.options.videoCaptureDefaults = { ...defaults, ...captureOptionsFor(quality) };
	}, [room, quality]);

	const restart = useStableCallback(async (track: LocalVideoTrack, next: VideoQuality) => {
		setPending(true);
		try {
			// The device too: without it the restart opens the browser's default camera.
			await track.restartTrack({ ...captureOptionsFor(next), deviceId: track.mediaStreamTrack.getSettings().deviceId });
			applied.current = { track, quality: next };
		} finally {
			setPending(false);
		}
	});

	// A new camera opened at the choice; one turned back on reopens at what it had, which a choice made while it was
	// off has since replaced.
	useEffect(() => {
		if (!videoTrack) {
			return;
		}
		if (applied.current?.track !== videoTrack) {
			applied.current = { track: videoTrack, quality };
			return;
		}
		if (applied.current.quality !== quality) {
			restart(videoTrack, quality).catch(warn);
		}
	}, [videoTrack, quality, restart]);

	// Remembered once the camera took it, so the next call does not start from a resolution this one refused.
	const select = useStableCallback((next: VideoQuality) => {
		if (pending || next === quality) {
			return;
		}
		if (!videoTrack) {
			selectVideoQuality(next);
			return;
		}
		restart(videoTrack, next).then(() => selectVideoQuality(next), warn);
	});

	return useMemo(
		() => ({
			quality,
			qualities: ORDER,
			height: sentHeight,
			pending,
			select,
		}),
		[quality, sentHeight, pending, select],
	);
};
