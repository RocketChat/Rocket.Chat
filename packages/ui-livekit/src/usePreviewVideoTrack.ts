import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { BackgroundBlurProcessor, MediaProcessorAssets } from '@rocket.chat/media-processors';
import { loadBackgroundBlurProcessor } from '@rocket.chat/media-processors';
import type { BlurLevel, BlurModel, VideoQuality } from '@rocket.chat/ui-conference';
import type { LocalVideoTrack } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';

import { BLUR_STRENGTH } from './useBackgroundBlur';
import { useVirtualBackground } from './useVirtualBackground';

export type PreviewVideoOptions = {
	deviceId?: string;
	quality?: VideoQuality;
	blurLevel?: BlurLevel;
	blurModel?: BlurModel;
	onOpen?: () => void;
};

/** The preflight's camera, once it is open, and whether opening it failed. */
export type PreviewVideo = { track?: LocalVideoTrack; error: boolean };

/** The same presets the in-call picker uses, so a resolution means the same thing on both screens. */
const RESOLUTIONS: Record<Exclude<VideoQuality, 'auto'>, { width: number; height: number }> = {
	h1080: { width: 1920, height: 1080 },
	h720: { width: 1280, height: 720 },
	h360: { width: 640, height: 360 },
	h180: { width: 320, height: 180 },
};

const noop = () => undefined;

/**
 * The camera for the preflight, as a LiveKit track rather than a bare `getUserMedia` stream: blur is a
 * `TrackProcessor`, which needs a `LocalTrack` to attach to, so the preview runs the same processor at the same
 * strength and resolution the call will send.
 *
 * The track is stopped when this unmounts, so the camera light goes out when the preflight does.
 */
export const usePreviewVideoTrack = (
	enabled: boolean,
	{ deviceId, quality = 'auto', blurLevel = 'none', blurModel = 'quality', onOpen = noop }: PreviewVideoOptions,
	assets: MediaProcessorAssets,
): PreviewVideo => {
	const virtualBackground = useVirtualBackground();
	const [track, setTrack] = useState<LocalVideoTrack | undefined>();
	const [error, setError] = useState(false);
	const onOpened = useStableCallback(onOpen);
	const qualityRef = useRef(quality);
	qualityRef.current = quality;
	const requestedQuality = useRef<{ track: LocalVideoTrack; quality: VideoQuality } | undefined>(undefined);

	// Opens a new camera only when the device changes; a resolution change restarts this track in place below: replacing
	// a processed track makes the video element follow a stopped canvas while the replacement processor initializes,
	// which presents as a permanently black preview on slower, low-resolution camera modes.
	useEffect(() => {
		if (!enabled) {
			return;
		}

		let cancelled = false;
		let opened: LocalVideoTrack | undefined;
		const initialQuality = qualityRef.current;

		// Not `exact`: a camera remembered from an earlier call can be gone, and the preview should still show one.
		void createLocalVideoTrack({
			...(deviceId && { deviceId }),
			...(initialQuality !== 'auto' && { resolution: RESOLUTIONS[initialQuality] }),
		})
			.then((next) => {
				opened = next;
				if (cancelled) {
					next.stop();
					return;
				}
				requestedQuality.current = { track: next, quality: initialQuality };
				setError(false);
				setTrack(next);
				onOpened();
			})
			.catch(() => {
				if (!cancelled) {
					setError(true);
					setTrack(undefined);
				}
			});

		return () => {
			cancelled = true;
			// Stopped rather than left running: a preview nobody is looking at should not keep the camera light on.
			opened?.stop();
			// What this attempt found is not what the next one will: neither its frame nor its failure is shown again.
			setTrack(undefined);
			setError(false);
		};
	}, [enabled, deviceId, onOpened]);

	// The render that turns the camera off comes before the cleanup that forgets the track.
	const shownTrack = enabled ? track : undefined;
	const shownError = enabled && error;

	// Keeps the LocalVideoTrack identity, and so the element attached to its processed output, stable while changing
	// resolution. LiveKit restarts the processor with the replacement camera track once capture has changed.
	useEffect(() => {
		if (!shownTrack || (requestedQuality.current?.track === shownTrack && requestedQuality.current.quality === quality)) {
			return;
		}

		let cancelled = false;
		requestedQuality.current = { track: shownTrack, quality };

		void shownTrack
			.restartTrack(quality === 'auto' ? {} : { resolution: RESOLUTIONS[quality] })
			.then(() => {
				if (!cancelled) {
					setError(false);
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(true);
					console.warn('the preview camera would not change resolution', err);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [shownTrack, quality]);

	// Blur, applied to whichever track is current. Switched where a processor is already loaded, so moving between
	// strengths costs nothing after the first.
	useEffect(() => {
		if (!shownTrack) {
			return;
		}

		let cancelled = false;

		void (async () => {
			try {
				const backgroundImage = virtualBackground.active ? virtualBackground.image : undefined;
				const strength = backgroundImage || blurLevel === 'none' ? 0 : BLUR_STRENGTH[blurLevel];
				const existing = shownTrack.getProcessor() as BackgroundBlurProcessor | undefined;

				if (existing) {
					const BackgroundBlurProcessor = await loadBackgroundBlurProcessor();
					if (cancelled) {
						return;
					}

					if (existing.revision === BackgroundBlurProcessor.revision) {
						// Already segmenting: both blur strength and the uploaded replacement texture can change without
						// rebuilding the processor or republishing the camera.
						existing.setBackgroundImage(backgroundImage);
						existing.setStrength(strength);
						return;
					}

					// Fast refresh cannot alter a processor that is already running, so a stale development-only instance is
					// replaced.
					await shownTrack.stopProcessor();
					if (!cancelled && (strength || backgroundImage)) {
						await shownTrack.setProcessor(new BackgroundBlurProcessor(assets, strength, blurModel, backgroundImage));
					}
					return;
				}

				if (!strength && !backgroundImage) {
					return;
				}

				const BackgroundBlurProcessor = await loadBackgroundBlurProcessor();
				if (cancelled) {
					return;
				}

				await shownTrack.setProcessor(new BackgroundBlurProcessor(assets, strength, blurModel, backgroundImage));
			} catch (err) {
				// Failing here means an unblurred preview, which is the truth.
				console.warn('background blur could not be previewed', err);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [shownTrack, blurLevel, blurModel, virtualBackground.active, virtualBackground.image, assets]);

	return useMemo(() => ({ track: shownTrack, error: shownError }), [shownTrack, shownError]);
};
