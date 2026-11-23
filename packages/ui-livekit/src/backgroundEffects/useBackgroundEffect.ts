import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { BackgroundEffect, BackgroundEffectSelection, BackgroundPreset } from '@rocket.chat/ui-conference';
import { NO_BACKGROUND_EFFECT, isSameEffect, useBackgroundEffectPreference, useBackgroundImages } from '@rocket.chat/ui-conference';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { LocalVideoTrack } from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { EffectSource } from './effectProcessor';
import { applyEffect, frameHeightOf, supportsBackgroundEffects } from './effectProcessor';
import { useBackgroundEffectAssets } from './useBackgroundEffectAssets';
import { useBlurFollowsFrameHeight } from './useBlurFollowsFrameHeight';
import { useEffectProcessor, useProcessedTrack } from './useEffectProcessor';
import { useEffectStallWatchdog } from './useEffectStallWatchdog';

const MEDIUM_BLUR: BackgroundEffect = { kind: 'blur', level: 'medium' };

export type UseBackgroundEffectOptions = {
	/** Absent while the camera is off. */
	track?: LocalVideoTrack;
	baseUrl: string;
	/** Without it, a running effect is not watched for stalls. */
	onStalled?: () => void;
};

export type BackgroundEffectControl = {
	selection: BackgroundEffectSelection;
	/** The effect chosen, unless this browser cannot run one or it failed in this call. */
	wanted: BackgroundEffect;
	sourceFor: (frameHeight: number) => Promise<EffectSource>;
	selfViewStream?: MediaStream;
	/** The effect stays remembered, but this call goes on without one. */
	reportStartFailure: () => void;
	/** The effect failed, and the participant has not yet agreed to a camera without it. */
	bareCameraUnconfirmed: boolean;
	confirmBareCamera: () => void;
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
	const { images, loaded: imagesLoaded, imageLimit, addImage, removeImage, getImageUrl } = useBackgroundImages();
	const supported = supportsBackgroundEffects();

	const [failure, setFailure] = useState<'unconfirmed' | 'confirmed'>();
	const [applying, setApplying] = useState<BackgroundEffect>();
	const failed = failure !== undefined;

	const available = (effect: BackgroundEffect) =>
		!(effect.kind === 'image' && imagesLoaded && !images.some((image) => image.id === effect.id)) &&
		!(effect.kind === 'preset' && assets && !assets.presets.some((preset) => preset.id === effect.id));

	const remembered = available(backgroundEffect) ? backgroundEffect : NO_BACKGROUND_EFFECT;
	const wanted = supported && !failed ? remembered : NO_BACKGROUND_EFFECT;

	const running = useEffectProcessor(track).effect ?? NO_BACKGROUND_EFFECT;
	const shown = track ? running : wanted;

	const sourceFor = useStableCallback(async (frameHeight: number): Promise<EffectSource> => ({
		assets: await loadAssets(),
		imageUrl: getImageUrl,
		frameHeight,
	}));

	const reportFailure = useStableCallback((message = t('Background_effect_could_not_be_applied')) =>
		dispatchToastMessage({ type: 'error', message }),
	);

	const attempt = useRef(0);

	const apply = useStableCallback(async (effect: BackgroundEffect) => {
		if (!track) {
			selectBackgroundEffect(effect);
			setFailure(undefined);
			return;
		}
		const id = ++attempt.current;
		setApplying(effect);
		try {
			await applyEffect(track, effect, await sourceFor(frameHeightOf(track)));
			if (id === attempt.current) {
				selectBackgroundEffect(effect);
				setFailure(undefined);
			}
		} catch (err) {
			console.warn('the background effect could not be applied', err);
			if (id === attempt.current) {
				reportFailure();
			}
		} finally {
			if (id === attempt.current) {
				setApplying(undefined);
			}
		}
	});

	useEffect(() => {
		if (!track || !imagesLoaded || isSameEffect(running, wanted)) {
			return;
		}
		void apply(wanted);
		// Only for a new camera: a choice afterwards goes through `select`.
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, [track, imagesLoaded]);

	useBlurFollowsFrameHeight(track);

	useEffectStallWatchdog(track, Boolean(onStalled && running.kind !== 'none' && !applying), () => {
		onStalled?.();
		setFailure('unconfirmed');
		reportFailure();
	});

	const presets = useMemo(
		(): BackgroundPreset[] =>
			(assets?.presets ?? []).map(({ id, url }) => ({ id, url, name: t(`Background_preset_${id.replace(/-/g, '_')}`) })),
		[assets, t],
	);

	const select = useStableCallback((effect: BackgroundEffect) => {
		if (applying || (isSameEffect(effect, shown) && !failed)) {
			return;
		}
		void apply(effect);
	});

	const selection = useMemo(
		(): BackgroundEffectSelection => ({
			supported,
			effect: failed ? NO_BACKGROUND_EFFECT : shown,
			applying,
			presets,
			images,
			imageLimit,
			select,
			toggle: () => select(shown.kind === 'none' || failed ? (backgroundHistory.at(-1) ?? MEDIUM_BLUR) : NO_BACKGROUND_EFFECT),
			addImage: (file) => {
				addImage(file).then(
					(image) => select({ kind: 'image', id: image.id }),
					() => reportFailure(t('Background_image_could_not_be_used')),
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
			},
		}),
		[
			supported,
			failed,
			shown,
			applying,
			presets,
			images,
			imageLimit,
			select,
			backgroundHistory,
			addImage,
			reportFailure,
			t,
			forgetBackgroundEffect,
			track,
			running,
			apply,
			removeImage,
		],
	);

	const processedTrack = useProcessedTrack(track);
	const selfViewStream = useMemo(() => (processedTrack ? new MediaStream([processedTrack]) : track?.mediaStream), [processedTrack, track]);

	const reportStartFailure = useStableCallback(() => {
		setFailure('unconfirmed');
		reportFailure();
	});

	const confirmBareCamera = useStableCallback(() => setFailure('confirmed'));

	return {
		selection,
		wanted,
		sourceFor,
		selfViewStream,
		reportStartFailure,
		bareCameraUnconfirmed: failure === 'unconfirmed',
		confirmBareCamera,
	};
};
