import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { BackgroundEffect, BackgroundEffectSelection, BackgroundPreset } from '@rocket.chat/ui-conference';
import { NO_BACKGROUND_EFFECT, isSameEffect, useBackgroundEffectPreference, useBackgroundImages } from '@rocket.chat/ui-conference';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { LocalVideoTrack } from 'livekit-client';
import { TrackEvent } from 'livekit-client';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { EffectSource } from './effectProcessor';
import {
	EFFECT_STALL_LIMIT_MS,
	applyEffect,
	forgetProcessor,
	frameHeightOf,
	processorOf,
	supportsBackgroundEffects,
	switchOptionsFor,
} from './effectProcessor';
import { useBackgroundEffectAssets } from './useBackgroundEffectAssets';

const MEDIUM_BLUR: BackgroundEffect = { kind: 'blur', level: 'medium' };

export type UseBackgroundEffectOptions = {
	/** Absent while the camera is off. */
	track?: LocalVideoTrack;
	baseUrl: string;
	/** The owner turns the camera off, so the room is never sent. */
	onStalled?: () => void;
};

export type BackgroundEffectControl = {
	selection: BackgroundEffectSelection;
	/** The effect chosen, unless this browser cannot run one. */
	wanted: BackgroundEffect;
	sourceFor: (frameHeight: number) => Promise<EffectSource>;
	selfViewStream?: MediaStream;
	/** The effect stays remembered, but this call goes on without one. */
	reportStartFailure: () => void;
};

/**
 * The background effect of one camera, preview or call. A choice is remembered once it is in place, or at once while the
 * camera is off; a failure leaves it alone.
 */
export const useBackgroundEffect = ({ track, baseUrl, onStalled }: UseBackgroundEffectOptions): BackgroundEffectControl => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { assets, load: loadAssets } = useBackgroundEffectAssets(baseUrl);
	const { backgroundEffect, backgroundHistory, selectBackgroundEffect, forgetBackgroundEffect } = useBackgroundEffectPreference();
	const { images, loaded: imagesLoaded, addImage, removeImage } = useBackgroundImages();
	const supported = supportsBackgroundEffects();

	// Pictures added in this render are not in `images` yet.
	const imageUrls = useRef(new Map<string, string>());
	images.forEach((image) => imageUrls.current.set(image.id, image.url));

	const [startFailed, setStartFailed] = useState(false);
	const [applying, setApplying] = useState<BackgroundEffect>();
	const [, refresh] = useReducer((n: number) => n + 1, 0);

	const available = (effect: BackgroundEffect) =>
		!(effect.kind === 'image' && imagesLoaded && !images.some((image) => image.id === effect.id)) &&
		!(effect.kind === 'preset' && assets && !assets.presets.some((preset) => preset.id === effect.id));

	const remembered = available(backgroundEffect) ? backgroundEffect : NO_BACKGROUND_EFFECT;
	const wanted = supported && !startFailed ? remembered : NO_BACKGROUND_EFFECT;

	const running = processorOf(track)?.effect ?? NO_BACKGROUND_EFFECT;
	const shown = track ? running : wanted;

	const sourceFor = useStableCallback(async (frameHeight: number): Promise<EffectSource> => ({
		assets: await loadAssets(),
		imageUrl: (id) => imageUrls.current.get(id),
		frameHeight,
	}));

	const failed = useStableCallback((message = t('Background_effect_could_not_be_applied')) =>
		dispatchToastMessage({ type: 'error', message }),
	);

	// A new attempt or track abandons the previous one.
	const attempt = useRef(0);

	const apply = useStableCallback(async (effect: BackgroundEffect) => {
		if (!track) {
			selectBackgroundEffect(effect);
			setStartFailed(false);
			return;
		}
		const id = ++attempt.current;
		setApplying(effect);
		try {
			await applyEffect(track, effect, await sourceFor(frameHeightOf(track)));
			if (id === attempt.current) {
				selectBackgroundEffect(effect);
				setStartFailed(false);
			}
		} catch (err) {
			console.warn('the background effect could not be applied', err);
			if (id === attempt.current) {
				failed();
			}
		} finally {
			if (id === attempt.current) {
				setApplying(undefined);
				refresh();
			}
		}
	});

	// A new or resumed camera gets the effect chosen meanwhile.
	useEffect(() => {
		if (!track || !imagesLoaded) {
			return;
		}
		const current = processorOf(track)?.effect ?? NO_BACKGROUND_EFFECT;
		if (isSameEffect(current, wanted)) {
			return;
		}
		void apply(wanted);
		// Only for a new camera: a choice afterwards goes through `select`.
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, [track, imagesLoaded]);

	// LiveKit restarts the processor with the camera.
	useEffect(() => {
		if (!track) {
			return;
		}
		track.on(TrackEvent.TrackProcessorUpdate, refresh);
		return () => {
			track.off(TrackEvent.TrackProcessorUpdate, refresh);
		};
	}, [track]);

	// A blur is a share of the frame's height.
	const frameHeight = frameHeightOf(track);
	useEffect(() => {
		const current = processorOf(track);
		if (current?.effect.kind !== 'blur' || !assets) {
			return;
		}
		void current.processor
			.switchTo(switchOptionsFor(current.effect, { assets, imageUrl: () => undefined, frameHeight }))
			.catch(() => undefined);
	}, [track, frameHeight, assets]);

	// A processor that stops producing frames is treated as failed.
	const watching = Boolean(onStalled && track && running.kind !== 'none' && !applying);
	useEffect(() => {
		if (!watching || !track) {
			return;
		}
		const current = processorOf(track);
		if (!current) {
			return;
		}
		const resetClock = () => {
			current.lastFrameAt = performance.now();
		};
		resetClock();
		document.addEventListener('visibilitychange', resetClock);
		const interval = setInterval(() => {
			if (document.visibilityState !== 'visible' || track.isMuted) {
				resetClock();
				return;
			}
			if (performance.now() - current.lastFrameAt > EFFECT_STALL_LIMIT_MS) {
				clearInterval(interval);
				forgetProcessor(track);
				onStalled?.();
				void track.stopProcessor().catch(() => undefined);
				setStartFailed(true);
				failed();
				refresh();
			}
		}, 1000);
		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', resetClock);
		};
	}, [watching, track, onStalled, failed]);

	const presets = useMemo(
		(): BackgroundPreset[] =>
			(assets?.presets ?? []).map(({ id, url }) => ({ id, url, name: t(`Background_preset_${id.replace(/-/g, '_')}`) })),
		[assets, t],
	);

	const select = useStableCallback((effect: BackgroundEffect) => {
		if (applying || (isSameEffect(effect, shown) && !startFailed)) {
			return;
		}
		void apply(effect);
	});

	const selection = useMemo(
		(): BackgroundEffectSelection => ({
			supported,
			effect: startFailed ? NO_BACKGROUND_EFFECT : shown,
			applying,
			presets,
			images,
			select,
			toggle: () => select(shown.kind === 'none' || startFailed ? (backgroundHistory.at(-1) ?? MEDIUM_BLUR) : NO_BACKGROUND_EFFECT),
			addImage: (file) => {
				addImage(file).then(
					(image) => {
						imageUrls.current.set(image.id, image.url);
						select({ kind: 'image', id: image.id });
					},
					() => failed(t('Background_image_could_not_be_used')),
				);
			},
			removeImage: (id) => {
				const removed: BackgroundEffect = { kind: 'image', id };
				const fallback = backgroundHistory.filter((used) => !isSameEffect(used, removed)).at(-1) ?? NO_BACKGROUND_EFFECT;
				forgetBackgroundEffect(removed);
				if (track && isSameEffect(running, removed)) {
					void apply(fallback);
				}
				removeImage(id);
				imageUrls.current.delete(id);
			},
		}),
		[
			supported,
			startFailed,
			shown,
			applying,
			presets,
			images,
			select,
			backgroundHistory,
			addImage,
			failed,
			t,
			forgetBackgroundEffect,
			track,
			running,
			apply,
			removeImage,
		],
	);

	const processedTrack = track?.getProcessor()?.processedTrack;
	const selfViewStream = useMemo(() => (processedTrack ? new MediaStream([processedTrack]) : track?.mediaStream), [processedTrack, track]);

	const reportStartFailure = useStableCallback(() => {
		setStartFailed(true);
		failed();
	});

	return { selection, wanted, sourceFor, selfViewStream, reportStartFailure };
};
