import type { BackgroundEffect } from '@rocket.chat/ui-conference';
import type { LocalVideoTrack, Room, Track, TrackProcessor } from 'livekit-client';

const BLUR_RADIUS = 10;

/** Confidence below the low end is background and above the high end is the person, so faint ghosts drop out. */
const ALPHA_RANGE: [number, number] = [0.2, 0.8];

const PROCESSOR_NAME = 'background-effect';

const SEGMENTATION_MODEL = 'selfie_multiclass_256x256_fp16.tflite';

export type VisibleBackgroundEffect = Exclude<BackgroundEffect, { mode: 'none' }>;

/** Thrown when this browser cannot run the segmenter, so the effect is withdrawn rather than retried. */
export class UnsupportedError extends Error {}

const loadProcessors = () => import('@livekit/track-processors');

export const supportsBackgroundEffects = async (): Promise<boolean> => (await loadProcessors()).supportsBackgroundProcessors();

const switchOptions = (effect: VisibleBackgroundEffect) =>
	effect.mode === 'blur'
		? ({ mode: 'background-blur', blurRadius: BLUR_RADIUS } as const)
		: ({ mode: 'virtual-background', imagePath: effect.imageUrl } as const);

/**
 * Settles once `url` has loaded as an image. The processor carries on without a background it could not load, sending
 * the camera as it is, so an image is refused here instead.
 */
const loadImage = (url: string) =>
	new Promise<void>((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = 'Anonymous';
		image.onload = () => resolve();
		image.onerror = () => reject(new Error(`the background image ${url} could not be loaded`));
		image.src = url;
	});

/** A processor that puts `effect` behind the reader once a track runs it; the segmenter loads only then. */
export const createBackgroundProcessor = async (effect: VisibleBackgroundEffect, segmentationBaseUrl: string) => {
	const { BackgroundProcessor: createProcessor, supportsBackgroundProcessors } = await loadProcessors();
	if (!supportsBackgroundProcessors()) {
		throw new UnsupportedError();
	}
	if (effect.mode === 'image') {
		await loadImage(effect.imageUrl);
	}

	return createProcessor(
		{
			...switchOptions(effect),
			alphaRange: ALPHA_RANGE,
			temporalSmoothing: true,
			assetPaths: {
				tasksVisionFileSet: segmentationBaseUrl,
				modelAssetPath: `${segmentationBaseUrl}/${SEGMENTATION_MODEL}`,
			},
		},
		PROCESSOR_NAME,
	);
};

/** Puts `effect` behind the reader in place of whatever was there, without restarting the camera. */
export const applyBackgroundEffect = async (track: LocalVideoTrack, effect: BackgroundEffect, segmentationBaseUrl: string) => {
	if (effect.mode === 'none') {
		if (track.getProcessor()) {
			await track.stopProcessor();
		}
		return;
	}

	const { BackgroundProcessorWrapper } = await loadProcessors();
	const running = track.getProcessor();
	if (running instanceof BackgroundProcessorWrapper) {
		await running.switchTo(switchOptions(effect));
		return;
	}

	await track.setProcessor(await createBackgroundProcessor(effect, segmentationBaseUrl));
};

type BackgroundProcessor = Awaited<ReturnType<typeof createBackgroundProcessor>>;

/**
 * `processor`, made to let the camera go when it cannot start on it: a camera it was meant to cover then stays off
 * rather than going out with the room behind it. What is thrown instead is `onFailure`'s.
 */
export const failClosed = (processor: BackgroundProcessor, onFailure: (err: unknown) => Error): BackgroundProcessor => {
	const init = processor.init.bind(processor);
	processor.init = async (options) => {
		try {
			await init(options);
		} catch (err) {
			options.track.stop();
			throw onFailure(err);
		}
	};
	return processor;
};

/**
 * A processor that never lets the camera go out, for an effect that could not be made: the camera stays off, as it
 * would for one that cannot start on it. What is thrown is `onFailure`'s, given `err`.
 */
export const refuseCamera = (err: unknown, onFailure: (err: unknown) => Error): TrackProcessor<Track.Kind.Video> => ({
	name: PROCESSOR_NAME,
	init: async ({ track }) => {
		track.stop();
		throw onFailure(err);
	},
	restart: async () => undefined,
	destroy: async () => undefined,
});

/** What the room puts on the next camera it opens, before anything of it is sent; nothing, without a processor. */
export const setCaptureProcessor = (room: Room, processor: TrackProcessor<Track.Kind.Video> | undefined) => {
	const defaults = { ...room.options.videoCaptureDefaults };
	delete defaults.processor;
	room.options.videoCaptureDefaults = processor ? { ...defaults, processor } : defaults;
};
