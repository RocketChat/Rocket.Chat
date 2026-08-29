import type { LocalVideoTrack } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';

import type { BlurLevel, BlurModel, VideoQuality } from './useCallPreferences';
import type { BackgroundBlurProcessor } from '../../videoConference/livekit/backgroundBlurProcessor';
import { BLUR_STRENGTH } from '../../videoConference/livekit/useBackgroundBlur';
import { useVirtualBackground } from '../../videoConference/livekit/virtualBackground';

/** The same presets the in-call picker uses, so a resolution means the same thing on both screens. */
const RESOLUTIONS: Record<Exclude<VideoQuality, 'auto'>, { width: number; height: number }> = {
	h1080: { width: 1920, height: 1080 },
	h720: { width: 1280, height: 720 },
	h360: { width: 640, height: 360 },
	h180: { width: 320, height: 180 },
};

/**
 * The camera for the preflight, as a **LiveKit track** rather than a bare `getUserMedia` stream.
 *
 * This is what lets the preflight tell the truth about background blur. Blur is a `TrackProcessor`, and a processor
 * needs a `LocalTrack` to attach to — no room required, since MediaPipe blur has nothing to ask a server. Built this
 * way, the preview runs the *same* processor with the *same* radius the call will use, so what is on this screen is
 * what the call sends. A raw stream could only ever have shown an unblurred picture next to a blurred promise.
 *
 * It is also what makes the resolution choice real here rather than notional: the track is created with it.
 *
 * The track is stopped when this unmounts, so the camera light goes out if the user walks away. Handing it to the
 * room instead — `publishTrack` takes a pre-created track — would remove the re-acquire between this screen and the
 * call, and with it the flicker on entry and the need to re-apply blur on join. That is the next step, and it is why
 * this returns the track itself rather than a stream.
 */
export const usePreviewVideoTrack = (
	enabled: boolean,
	{
		deviceId,
		quality,
		blurLevel,
		blurModel = 'quality',
	}: { deviceId?: string; quality: VideoQuality; blurLevel: BlurLevel; blurModel?: BlurModel },
): { track?: LocalVideoTrack; error: boolean } => {
	const virtualBackground = useVirtualBackground();
	const [track, setTrack] = useState<LocalVideoTrack | undefined>();
	const [error, setError] = useState(false);
	const qualityRef = useRef(quality);
	qualityRef.current = quality;
	const requestedQuality = useRef<{ track: LocalVideoTrack; quality: VideoQuality } | undefined>(undefined);

	// Open a new camera only when the device changes. Resolution changes restart this track in place below: replacing
	// a processed track makes the video element follow a stopped canvas while the replacement processor initializes,
	// which presents as a permanently black preview on slower, low-resolution camera modes.
	useEffect(() => {
		if (!enabled) {
			requestedQuality.current = undefined;
			setTrack(undefined);
			return;
		}

		let cancelled = false;
		let opened: LocalVideoTrack | undefined;
		const initialQuality = qualityRef.current;

		void createLocalVideoTrack({
			...(deviceId && { deviceId: { exact: deviceId } }),
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
		};
	}, [enabled, deviceId]);

	// Keep the LocalVideoTrack identity (and therefore the element attached to its processed output) stable while
	// changing resolution. LiveKit restarts the processor with the replacement camera track once capture has changed.
	useEffect(() => {
		if (!track || (requestedQuality.current?.track === track && requestedQuality.current.quality === quality)) {
			return;
		}

		let cancelled = false;
		requestedQuality.current = { track, quality };

		void track
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
	}, [track, quality]);

	// Blur, applied to whichever track is current. Switched where a processor is already loaded, so moving between
	// strengths costs nothing after the first — the same arrangement as in the call.
	useEffect(() => {
		if (!track) {
			return;
		}

		let cancelled = false;

		void (async () => {
			try {
				const backgroundImage = virtualBackground.active ? virtualBackground.image : undefined;
				const strength = backgroundImage || blurLevel === 'none' ? 0 : BLUR_STRENGTH[blurLevel];
				const existing = track.getProcessor() as BackgroundBlurProcessor | undefined;

				if (existing) {
					const { BackgroundBlurProcessor } = await import('../../videoConference/livekit/backgroundBlurProcessor');
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

					// Fast refresh cannot alter the capture mode of a processor that is already running. Replace that
					// development-only stale instance so testing this fix does not require restarting the whole app.
					await track.stopProcessor();
					if (!cancelled && (strength || backgroundImage)) {
						await track.setProcessor(new BackgroundBlurProcessor(strength, blurModel, backgroundImage));
					}
					return;
				}

				if (!strength && !backgroundImage) {
					return;
				}

				const { BackgroundBlurProcessor } = await import('../../videoConference/livekit/backgroundBlurProcessor');
				if (cancelled) {
					return;
				}

				await track.setProcessor(new BackgroundBlurProcessor(strength, blurModel, backgroundImage));
			} catch (err) {
				// MediaPipe comes from a CDN. Failing here means an unblurred preview, which is the truth.
				console.warn('background blur could not be previewed', err);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [track, blurLevel, blurModel, virtualBackground.active, virtualBackground.image]);

	return { track, error };
};
