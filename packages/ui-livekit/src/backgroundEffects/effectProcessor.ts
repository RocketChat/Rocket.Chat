import type {
	BackgroundOptions,
	BackgroundProcessorWrapper,
	BackgroundTransformer,
	SwitchBackgroundProcessorOptions,
} from '@livekit/track-processors';
import type { BackgroundEffect } from '@rocket.chat/ui-conference';
import type { LocalVideoTrack } from 'livekit-client';

import { blurRadiusFor } from './blurRadius';
import { withSmoothedMask } from './smoothedMaskTransformer';
import type { BackgroundEffectAssets } from './useBackgroundEffectAssets';

/** Counted only while the page is visible. */
export const EFFECT_START_LIMIT_MS = 15_000;

/** How long a running effect may go without a frame, on a visible page, before it counts as failed. */
export const EFFECT_STALL_LIMIT_MS = 5_000;

let supported: boolean | undefined;

/** Mirrors `supportsBackgroundProcessors` from @livekit/track-processors 0.8.3, without loading the library. */
const checkSupport = () => {
	const hasStreamProcessor = 'MediaStreamTrackGenerator' in globalThis && 'MediaStreamTrackProcessor' in globalThis;
	const hasCanvasFallback =
		typeof HTMLCanvasElement !== 'undefined' && typeof VideoFrame !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype;
	const canSegment =
		typeof OffscreenCanvas !== 'undefined' &&
		typeof VideoFrame !== 'undefined' &&
		typeof createImageBitmap !== 'undefined' &&
		Boolean(document.createElement('canvas').getContext('webgl2'));
	return canSegment && (hasStreamProcessor || hasCanvasFallback);
};

export const supportsBackgroundEffects = (): boolean => {
	supported ??= (() => {
		try {
			return checkSupport();
		} catch {
			return false;
		}
	})();
	return supported;
};

type EffectLibrary = {
	Wrapper: typeof BackgroundProcessorWrapper;
	Transformer: typeof BackgroundTransformer;
};

let library: Promise<EffectLibrary> | undefined;

/** Loaded on the first effect applied, so calls without one never download it. */
const loadLibrary = () => {
	library ??= import('@livekit/track-processors').then(
		({ BackgroundProcessorWrapper, BackgroundTransformer }) => ({
			Wrapper: BackgroundProcessorWrapper,
			Transformer: withSmoothedMask(BackgroundTransformer),
		}),
		(err) => {
			library = undefined;
			throw err;
		},
	);
	return library;
};

export type EffectSource = {
	assets: BackgroundEffectAssets;
	imageUrl: (id: string) => string | undefined;
	frameHeight: number;
};

export const switchOptionsFor = (
	effect: BackgroundEffect,
	{ assets, imageUrl, frameHeight }: EffectSource,
): SwitchBackgroundProcessorOptions => {
	switch (effect.kind) {
		case 'blur':
			return { mode: 'background-blur', blurRadius: blurRadiusFor(effect.level, frameHeight) };
		case 'preset': {
			const url = assets.presets.find((preset) => preset.id === effect.id)?.url;
			if (!url) {
				throw new Error(`No preset background ${effect.id}`);
			}
			return { mode: 'virtual-background', imagePath: url };
		}
		case 'image': {
			const url = imageUrl(effect.id);
			if (!url) {
				throw new Error('The background picture is no longer available');
			}
			return { mode: 'virtual-background', imagePath: url };
		}
		default:
			return { mode: 'disabled' };
	}
};

const transformerOptionsFor = (options: SwitchBackgroundProcessorOptions): BackgroundOptions => {
	switch (options.mode) {
		case 'background-blur':
			return { blurRadius: options.blurRadius };
		case 'virtual-background':
			return { imagePath: options.imagePath };
		default:
			return { backgroundDisabled: true };
	}
};

/** Calls back once the page has been visible for `ms` in total. */
const visibleTimeout = (ms: number, onTimeout: () => void) => {
	let spent = 0;
	let last = performance.now();
	const interval = setInterval(() => {
		const now = performance.now();
		if (document.visibilityState === 'visible') {
			spent += now - last;
		}
		last = now;
		if (spent >= ms) {
			clearInterval(interval);
			onTimeout();
		}
	}, 250);
	return () => clearInterval(interval);
};

export class EffectProcessor {
	readonly processor: BackgroundProcessorWrapper;

	effect: BackgroundEffect;

	/** Once it has produced a frame, a camera restart sends no unprocessed frame. */
	framed = false;

	lastFrameAt = 0;

	private readonly waiters = new Set<() => void>();

	static async create(effect: BackgroundEffect, source: EffectSource): Promise<EffectProcessor> {
		return new EffectProcessor(effect, source, await loadLibrary());
	}

	private constructor(effect: BackgroundEffect, source: EffectSource, { Wrapper, Transformer }: EffectLibrary) {
		this.effect = effect;
		const transformer = new Transformer({
			...transformerOptionsFor(switchOptionsFor(effect, source)),
			assetPaths: { tasksVisionFileSet: source.assets.runtimeUrl, modelAssetPath: source.assets.modelUrl },
			onFrameProcessed: () => {
				this.framed = true;
				this.lastFrameAt = performance.now();
				const waiting = [...this.waiters];
				this.waiters.clear();
				waiting.forEach((resolve) => resolve());
			},
		});
		this.processor = new Wrapper(transformer, 'background-processor');
	}

	/** Rejects when no frame comes within the start limit. */
	nextFrame(): Promise<void> {
		return new Promise((resolve, reject) => {
			const done = () => {
				cancel();
				resolve();
			};
			const cancel = visibleTimeout(EFFECT_START_LIMIT_MS, () => {
				this.waiters.delete(done);
				reject(new Error('The background effect did not start in time'));
			});
			this.waiters.add(done);
		});
	}

	/** The previous effect stays on screen until the new one is ready. */
	async switchTo(effect: BackgroundEffect, source: EffectSource): Promise<void> {
		await this.processor.switchTo(switchOptionsFor(effect, source));
		await this.nextFrame();
		this.effect = effect;
	}
}

const processors = new WeakMap<LocalVideoTrack, EffectProcessor>();

export const processorOf = (track: LocalVideoTrack | undefined) => (track ? processors.get(track) : undefined);

export const attachProcessor = (track: LocalVideoTrack, effectProcessor: EffectProcessor) => processors.set(track, effectProcessor);

export const forgetProcessor = (track: LocalVideoTrack) => processors.delete(track);

export const frameHeightOf = (track: LocalVideoTrack | undefined, fallback = 720) =>
	track?.mediaStreamTrack.getSettings().height ?? fallback;

/** Rejects if the effect is not in place in time, leaving a running processor on its previous effect. */
export const applyEffect = async (track: LocalVideoTrack, effect: BackgroundEffect, source: EffectSource): Promise<void> => {
	const current = processorOf(track);

	if (effect.kind === 'none') {
		if (current) {
			forgetProcessor(track);
			await track.stopProcessor();
		}
		return;
	}

	if (current) {
		await current.switchTo(effect, source);
		return;
	}

	const next = await EffectProcessor.create(effect, source);
	attachProcessor(track, next);
	try {
		await track.setProcessor(next.processor);
		await next.nextFrame();
	} catch (err) {
		forgetProcessor(track);
		await track.stopProcessor().catch(() => undefined);
		throw err;
	}
};
