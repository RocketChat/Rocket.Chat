import type { LocalVideoTrack } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BackgroundBlurProcessor } from './backgroundBlurProcessor';
import { supportsBackgroundBlur } from './backgroundBlurSupport';
import { activateVirtualBackground, deactivateVirtualBackground, selectVirtualBackground, useVirtualBackground } from './virtualBackground';
import type { BlurLevel, BlurModel } from '../../conference/hooks/useCallPreferences';
import { useBackgroundBlurPreference } from '../../conference/hooks/useCallPreferences';

/** Which way of blurring is doing it. The camera's own effect has no strengths to choose between. */
type Blur = 'camera' | 'processor';

/**
 * How strong each level is, as a fraction of the frame's height.
 *
 * A fraction rather than a number of pixels: the same track is watched at whatever size the other end's tile happens
 * to be, so what has to hold across resolutions is the blur *relative to the picture*. Twelve pixels on a 360p frame
 * and thirty-six on 1080p are the same photograph; pinning it to pixels would make every level three times lighter
 * as the camera got better.
 *
 * Three, because "on" is not a useful amount: a little softens a room, a lot hides it, and people want different
 * ones of those. Tuned by eye against Meet at the same resolution — light is a hint of separation, strong hides the
 * room behind you.
 */
export const BLUR_STRENGTH: Record<Exclude<BlurLevel, 'none'>, number> = { light: 0.016, medium: 0.032, strong: 0.064 };

export type CameraBlurCapability = 'none' | 'fixed' | 'controllable';

/** A one-value capability can be observed, but only `[false, true]` can be changed by the application. */
export const cameraBlurCapability = (values: boolean[] | undefined): CameraBlurCapability => {
	if (!values?.includes(true)) {
		return 'none';
	}
	return values.includes(false) ? 'controllable' : 'fixed';
};

/**
 * Blurring the background of the local camera, at a strength the user picks.
 *
 * Two ways of doing it, and which one runs is whichever can:
 *
 * **The camera's own**, via the `backgroundBlur` constraint — free, done by the platform before the frames reach
 * us. Some platforms make it controllable and others only let us observe the OS setting. It is asked for through
 * `getCapabilities()` rather than by trying it, because `applyConstraints` resolves happily for an unknown constraint.
 * It has no strength to choose: it is on or off, so picking any level turns it on where control is available.
 *
 * **Ours**, via {@link BackgroundBlurProcessor}: MediaPipe confidence segmentation refined and composited on WebGL2.
 * This one takes a strength, and changing it is a number on the running processor — no rebuild or re-publish — so
 * only the first choice in a call is slow.
 */
export const useBackgroundBlur = (videoTrack: LocalVideoTrack | undefined) => {
	const { blurLevel: preferred, selectBlurLevel, blurModel, selectBlurModel } = useBackgroundBlurPreference();
	const virtualBackground = useVirtualBackground();
	const virtualBackgroundRef = useRef(virtualBackground);
	virtualBackgroundRef.current = virtualBackground;
	const processorAvailable = useMemo(supportsBackgroundBlur, []);

	const processorRef = useRef<BackgroundBlurProcessor | null>(null);
	const blurRef = useRef<Blur | null>(null);
	const cameraControllableRef = useRef(false);
	const trackRef = useRef<LocalVideoTrack | undefined>(videoTrack);
	trackRef.current = videoTrack;

	const [blur, setBlur] = useState<Blur | null>(null);
	const [available, setAvailable] = useState(false);
	const [level, setLevel] = useState<BlurLevel>(preferred);
	const levelRef = useRef<BlurLevel>(level);
	levelRef.current = level;
	const [pending, setPending] = useState(false);
	const blurModelRef = useRef<BlurModel>(blurModel);
	blurModelRef.current = blurModel;

	const cameraCapability = useCallback((track: LocalVideoTrack) => {
		const capabilities = track.mediaStreamTrack?.getCapabilities?.() as { backgroundBlur?: boolean[] } | undefined;
		return cameraBlurCapability(capabilities?.backgroundBlur);
	}, []);

	// When the track goes away (camera toggled off), keep the blur UI available at whatever level it was — the user
	// should still be able to pick a strength while the camera is off, and it will be applied when the camera returns.
	// Only the processor needs to be stopped; the preference and availability survive.
	useEffect(() => {
		if (!videoTrack) {
			const processor = processorRef.current;
			processorRef.current = null;
			if (processor) {
				// Track is already gone; just drop the processor reference.
				processor.setStrength(0);
			}
			return;
		}

		let cancelled = false;
		const mediaTrack = videoTrack.mediaStreamTrack;
		const syncCameraLevel = () => setLevel(mediaTrack?.getSettings?.().backgroundBlur ? 'medium' : 'none');

		void (async () => {
			const nativeCapability = cameraCapability(videoTrack);
			const backgroundImage = virtualBackground.active ? virtualBackground.image : undefined;
			if (nativeCapability !== 'none' && !backgroundImage) {
				cameraControllableRef.current = nativeCapability === 'controllable';
				blurRef.current = 'camera';
				setBlur('camera');
				setAvailable(nativeCapability === 'controllable');
				syncCameraLevel();
				mediaTrack?.addEventListener('configurationchange', syncCameraLevel);
				if (nativeCapability === 'controllable' && levelRef.current !== 'none') {
					void videoTrack.mediaStreamTrack
						?.applyConstraints({ backgroundBlur: true })
						.then(syncCameraLevel)
						.catch((err: unknown) => console.warn('could not re-apply camera blur', err));
				}
				return;
			}

			if (cancelled) {
				return;
			}

			if (!processorAvailable) {
				return;
			}

			// A controllable camera blur must be disabled before image replacement; otherwise it softens the person edge
			// before our segmenter sees it. Fixed OS effects cannot be controlled, but can still be composited.
			if (backgroundImage && nativeCapability === 'controllable' && mediaTrack?.getSettings?.().backgroundBlur) {
				await mediaTrack.applyConstraints({ backgroundBlur: false }).catch(() => undefined);
			}

			blurRef.current = 'processor';
			setBlur('processor');
			setAvailable(true);

			// Re-apply the processor at the remembered level when the camera comes back.
			const currentLevel = levelRef.current;
			if (currentLevel !== 'none' || backgroundImage) {
				const strength = backgroundImage || currentLevel === 'none' ? 0 : BLUR_STRENGTH[currentLevel];
				try {
					const { BackgroundBlurProcessor } = await import('./backgroundBlurProcessor');
					if (cancelled) return;
					const processor = new BackgroundBlurProcessor(strength, blurModelRef.current, backgroundImage);
					await videoTrack.setProcessor(processor);
					processorRef.current = processor;
				} catch (err) {
					console.warn('background blur could not be re-applied', err);
					if (backgroundImage) {
						deactivateVirtualBackground();
					}
					setLevel('none');
				}
			}
		})();

		return () => {
			cancelled = true;
			mediaTrack?.removeEventListener('configurationchange', syncCameraLevel);
			cameraControllableRef.current = false;
			const processor = processorRef.current;
			processorRef.current = null;
			if (processor) {
				void videoTrack.stopProcessor?.().catch(() => undefined);
			}
		};
	}, [videoTrack, cameraCapability, processorAvailable, virtualBackground.active, virtualBackground.image]);

	/**
	 * Picks a strength, or none.
	 *
	 * The setup effect above applies a remembered level when a camera arrives. This path handles later user choices;
	 * changing the strength of an existing processor is instant and does not republish the camera.
	 */
	const select = useCallback(
		(next: BlurLevel) => {
			const imageWasActive = virtualBackgroundRef.current.active;
			if (pending || (next === level && !imageWasActive)) {
				return;
			}

			selectBlurLevel(next);
			if (imageWasActive) {
				deactivateVirtualBackground();
				setLevel(next);
				return;
			}

			const track = trackRef.current;
			if (!track) {
				setLevel(next);
				return;
			}

			if (blurRef.current === 'camera') {
				if (!cameraControllableRef.current) {
					return;
				}
				// One effect, no strengths: any level means on.
				const on = next !== 'none';
				void track.mediaStreamTrack
					?.applyConstraints({ backgroundBlur: on })
					// Read back rather than assumed, since the request resolves either way.
					.then(() => setLevel(track.mediaStreamTrack?.getSettings?.().backgroundBlur ? 'medium' : 'none'))
					.catch((err: unknown) => console.warn('the camera would not change its background blur', err));
				return;
			}

			setPending(true);
			void (async () => {
				try {
					const strength = next === 'none' ? 0 : BLUR_STRENGTH[next];
					const existing = processorRef.current;

					if (existing) {
						const { BackgroundBlurProcessor } = await import('./backgroundBlurProcessor');
						if (existing.revision === BackgroundBlurProcessor.revision) {
							// A number on a current processor is instant, and the camera stays published, which is why turning
							// blur off normally leaves it attached and passing frames through rather than detaching.
							existing.setStrength(strength);
							setLevel(next);
							return;
						}

						// Hot code replacement cannot rewrite shaders already compiled into an existing WebGL context. A
						// revision mismatch occurs only in a development session spanning such a change; replace that stale
						// processor once so the preview does not continue showing the previous compositor indefinitely.
						await track.stopProcessor?.();
						processorRef.current = null;
						if (next === 'none') {
							setLevel('none');
							return;
						}

						const processor = new BackgroundBlurProcessor(strength, blurModelRef.current);
						await track.setProcessor(processor);
						processorRef.current = processor;
						setLevel(next);
						return;
					}

					if (next === 'none') {
						setLevel('none');
						return;
					}

					const { BackgroundBlurProcessor } = await import('./backgroundBlurProcessor');
					const processor = new BackgroundBlurProcessor(strength, blurModelRef.current);
					await track.setProcessor(processor);
					processorRef.current = processor;
					setLevel(next);
				} catch (err) {
					// The model and the WASM come from a CDN, so this is where a workspace with no way out lands —
					// with blur off, which is the truth, rather than a level claiming to be applied.
					console.warn('background blur could not be started', err);
					setLevel('none');
				} finally {
					setPending(false);
				}
			})();
		},
		[level, pending, selectBlurLevel],
	);

	const selectImage = useCallback(
		async (file: File) => {
			if (pending) {
				return;
			}
			setPending(true);
			try {
				await selectVirtualBackground(file);
				selectBlurLevel('none');
				setLevel('none');
			} catch (err) {
				console.warn('virtual background image could not be selected', err);
			} finally {
				setPending(false);
			}
		},
		[pending, selectBlurLevel],
	);

	const activateImage = useCallback(() => {
		selectBlurLevel('none');
		setLevel('none');
		activateVirtualBackground();
	}, [selectBlurLevel]);

	const changeModel = useCallback(
		(next: BlurModel) => {
			if (next === blurModelRef.current) {
				return;
			}

			selectBlurModel(next);
			blurModelRef.current = next;

			const track = trackRef.current;
			const existing = processorRef.current;
			const backgroundImage = virtualBackgroundRef.current.active ? virtualBackgroundRef.current.image : undefined;
			if (!track || !existing || (levelRef.current === 'none' && !backgroundImage)) {
				return;
			}

			setPending(true);
			void (async () => {
				try {
					const strength = backgroundImage ? 0 : BLUR_STRENGTH[levelRef.current as Exclude<BlurLevel, 'none'>];
					await track.stopProcessor?.();
					processorRef.current = null;

					const { BackgroundBlurProcessor } = await import('./backgroundBlurProcessor');
					const processor = new BackgroundBlurProcessor(strength, next, backgroundImage);
					await track.setProcessor(processor);
					processorRef.current = processor;
				} catch (err) {
					console.warn('background blur model could not be changed', err);
				} finally {
					setPending(false);
				}
			})();
		},
		[selectBlurModel],
	);

	return useMemo(
		() => ({
			available,
			level,
			levels: blur === 'camera' ? ['none', 'medium'] : ['none', 'light', 'medium', 'strong'],
			blur,
			pending,
			preferred,
			select,
			model: blurModel,
			models: ['quality', 'performance'] as const,
			selectModel: changeModel,
			backgroundImage: {
				available: processorAvailable,
				active: virtualBackground.active,
				hasImage: Boolean(virtualBackground.image),
				name: virtualBackground.name,
				select: selectImage,
				activate: activateImage,
			},
		}),
		[
			available,
			level,
			blur,
			pending,
			preferred,
			select,
			blurModel,
			changeModel,
			processorAvailable,
			virtualBackground.active,
			virtualBackground.image,
			virtualBackground.name,
			selectImage,
			activateImage,
		],
	);
};
