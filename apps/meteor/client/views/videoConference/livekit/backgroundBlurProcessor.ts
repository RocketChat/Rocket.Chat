import type { Track, TrackProcessor, VideoProcessorOptions } from 'livekit-client';

import { BackgroundBlurRenderer } from './backgroundBlurRenderer';
import { supportsBackgroundBlur } from './backgroundBlurSupport';

/**
 * The two MediaPipe segmenters worth using here, and which one we use.
 *
 * `input` is the size the model itself works at. It matters because we hand the segmenter a frame scaled to exactly
 * that — see the note in `render` — so the mask comes back at this size rather than the camera's, and the difference
 * is the difference between blur costing 20ms a frame and 94ms.
 *
 * - **multiclass** names six things (background, hair, body-skin, face-skin, clothes, others) at 256×256. It holds an
 *   edge around hair far better than the two-class model, which is what makes it worth the other two costs: it is
 *   **15.6 MB** against 244 KB, and roughly twice the work per frame.
 * - **selfie** is one class at 256×144 — the landscape shape a call actually is, cheap, and blunter around hair.
 *
 * Both are served from `public/mediapipe/`, alongside the WASM runtime, so airgapped workspaces work out of the box.
 */
export const SEGMENTER_MODELS = {
	multiclass: {
		url: '/mediapipe/selfie_multiclass_256x256.tflite',
		input: { width: 256, height: 256 },
	},
	selfie: {
		url: '/mediapipe/selfie_segmenter_landscape.tflite',
		input: { width: 256, height: 144 },
	},
} as const;

export type SegmenterModelKey = 'quality' | 'performance';

export const SEGMENTER_BY_KEY: Record<SegmenterModelKey, (typeof SEGMENTER_MODELS)[keyof typeof SEGMENTER_MODELS]> = {
	quality: SEGMENTER_MODELS.multiclass,
	performance: SEGMENTER_MODELS.selfie,
};

/** The one in use when none is specified. */
export const SEGMENTER = SEGMENTER_MODELS.multiclass;

/**
 * MediaPipe's WASM, which has to match the version of `@mediapipe/tasks-vision` this app depends on — it is the
 * runtime for the JS in the package, not an independent thing. Keep the two in step when the package moves.
 *
 * Served from `public/mediapipe/wasm/`, copied from the npm package at build time. When `@mediapipe/tasks-vision`
 * is updated, re-copy the wasm directory contents.
 */
export const SEGMENTER_WASM = '/mediapipe/wasm';
export const SEGMENTER_WORKER = '/mediapipe/background-blur-worker.js';

/**
 * Which confidence mask describes the person, and whether it has to be read inside out.
 *
 * The multiclass model reports `background` and five parts of a person, so `1 - background` is the complete person.
 * The landscape model reports `selfie` directly. Reading this from the model labels keeps both models interchangeable.
 *
 * Confidence rather than category masks matters at the boundary: 60% confidence around a strand of hair becomes 60%
 * opacity instead of a hard verdict which no amount of later feathering can reconstruct.
 */
export const personConfidence = (labels: string[]): { index: number; invert: boolean } => {
	const background = labels.indexOf('background');
	return background < 0 ? { index: 0, invert: false } : { index: background, invert: true };
};

/**
 * Converts model confidence to an alpha matte and damps small frame-to-frame changes without trailing real motion.
 * Large changes are accepted immediately; only low-amplitude uncertainty, which appears as edge flicker, is averaged.
 */
export const stabilizeConfidenceMask = (values: Float32Array, previous: Uint8Array | undefined, invert: boolean): Uint8Array => {
	// This runs for the lifetime of a call. Reuse the previous matte when its shape is unchanged instead of allocating
	// another model-sized array on every segmentation and leaving it for the garbage collector.
	const next = previous?.length === values.length ? previous : new Uint8Array(values.length);
	const hasPrevious = previous?.length === values.length;

	for (let index = 0; index < values.length; index++) {
		const rawConfidence = Math.max(0, Math.min(1, invert ? 1 - values[index] : values[index]));
		// A semantic model assigns a little non-background probability to hard room details such as lettering, plants
		// and chair edges. Using that raw value as opacity mixes a faint sharp frame over the blur everywhere, which
		// reads as a halo. Suppress weak classifications while retaining a continuous midpoint for hair and soft edges.
		const normalized = Math.max(0, Math.min(1, (rawConfidence - 0.2) / 0.6));
		const confidence = normalized * normalized * (3 - 2 * normalized);
		const current = Math.round(confidence * 255);
		if (!hasPrevious) {
			next[index] = current;
			continue;
		}

		const old = previous[index];
		const difference = Math.abs(current - old);
		let response = 0.35;
		if (difference >= 96) {
			response = 1;
		} else if (difference >= 32) {
			response = 0.75;
		}
		next[index] = Math.round(old + (current - old) * response);
	}

	return next;
};

export type PrimarySubjectAnchor = { x: number; y: number };

type PrimarySubjectScratch = { labels?: Int32Array; queue?: Int32Array };
type SubjectComponent = { id: number; mass: number; x: number; y: number };

const SUBJECT_COMPONENT_THRESHOLD = 48;
const SUBJECT_EDGE_RADIUS = 2;
const INITIAL_SUBJECT_MIN_X = 0.15;
const INITIAL_SUBJECT_MAX_X = 0.85;
const MAX_SUBJECT_JUMP = 0.35;

const touchesSubjectComponent = (labels: Int32Array, width: number, height: number, index: number, selectedId: number): boolean => {
	const x = index % width;
	const y = Math.floor(index / width);
	for (let offsetY = -SUBJECT_EDGE_RADIUS; offsetY <= SUBJECT_EDGE_RADIUS; offsetY++) {
		const nextY = y + offsetY;
		if (nextY < 0 || nextY >= height) continue;
		for (let offsetX = -SUBJECT_EDGE_RADIUS; offsetX <= SUBJECT_EDGE_RADIUS; offsetX++) {
			const nextX = x + offsetX;
			if (nextX < 0 || nextX >= width) continue;
			if (labels[nextY * width + nextX] === selectedId) return true;
		}
	}
	return false;
};

const isSubjectCandidate = (component: SubjectComponent, previous?: PrimarySubjectAnchor): boolean => {
	if (!previous) {
		return component.x >= INITIAL_SUBJECT_MIN_X && component.x <= INITIAL_SUBJECT_MAX_X;
	}
	return Math.hypot(component.x - previous.x, component.y - previous.y) <= MAX_SUBJECT_JUMP;
};

const subjectScore = (component: SubjectComponent, previous?: PrimarySubjectAnchor): number => {
	const centre = 1 - Math.min(1, Math.abs(component.x - 0.5) * 2);
	const tracking = previous ? 1 - Math.min(1, Math.hypot(component.x - previous.x, component.y - previous.y) / 0.5) : 0;
	return component.mass * (1 + centre * 2 + tracking * 2.5);
};

const selectSubjectComponent = (components: SubjectComponent[], previous?: PrimarySubjectAnchor): SubjectComponent | undefined => {
	const candidates = components.filter((component) => isSubjectCandidate(component, previous));
	return candidates.slice(1).reduce((best, component) => {
		return best && subjectScore(best, previous) >= subjectScore(component, previous) ? best : component;
	}, candidates[0]);
};

/**
 * Retains the one connected foreground component most likely to be the caller.
 *
 * Selfie segmentation describes every person in the frame, but a meeting effect should follow the participant at
 * the camera rather than somebody passing behind them. Strong matte pixels form the components; soft pixels within
 * two model pixels of the chosen component are retained so hair and anti-aliased edges do not become hard cut-outs.
 * The previous centroid makes the selection sticky as the caller moves. Initial acquisition requires a component in
 * the broad central 70% of the frame; after that it must remain close to the last centroid. A person entering at the
 * border therefore cannot take over when the caller leaves, while normal movement can carry the tracked caller all
 * the way to an edge over consecutive masks.
 */
export const isolatePrimarySubject = (
	values: Uint8Array,
	width: number,
	height: number,
	previous?: PrimarySubjectAnchor,
	scratch?: PrimarySubjectScratch,
): { values: Uint8Array; anchor?: PrimarySubjectAnchor } => {
	if (width <= 0 || height <= 0 || values.length !== width * height) {
		return { values, anchor: previous };
	}

	const labels = scratch?.labels?.length === values.length ? scratch.labels : new Int32Array(values.length);
	const queue = scratch?.queue?.length === values.length ? scratch.queue : new Int32Array(values.length);
	labels.fill(0);
	if (scratch) {
		scratch.labels = labels;
		scratch.queue = queue;
	}
	const components: SubjectComponent[] = [];
	let componentId = 0;

	for (let start = 0; start < values.length; start++) {
		if (values[start] < SUBJECT_COMPONENT_THRESHOLD || labels[start]) {
			continue;
		}

		componentId++;
		let head = 0;
		let tail = 1;
		let mass = 0;
		let weightedX = 0;
		let weightedY = 0;
		queue[0] = start;
		labels[start] = componentId;

		while (head < tail) {
			const index = queue[head++];
			const x = index % width;
			const y = Math.floor(index / width);
			const weight = values[index] / 255;
			mass += weight;
			weightedX += x * weight;
			weightedY += y * weight;

			for (let offsetY = -1; offsetY <= 1; offsetY++) {
				const nextY = y + offsetY;
				if (nextY < 0 || nextY >= height) continue;
				for (let offsetX = -1; offsetX <= 1; offsetX++) {
					if (!offsetX && !offsetY) continue;
					const nextX = x + offsetX;
					if (nextX < 0 || nextX >= width) continue;
					const next = nextY * width + nextX;
					if (labels[next] || values[next] < SUBJECT_COMPONENT_THRESHOLD) continue;
					labels[next] = componentId;
					queue[tail++] = next;
				}
			}
		}

		components.push({ id: componentId, mass, x: (weightedX / mass + 0.5) / width, y: (weightedY / mass + 0.5) / height });
	}

	if (!components.length) {
		values.fill(0);
		return { values, anchor: previous };
	}

	const selected = selectSubjectComponent(components, previous);
	if (!selected) {
		values.fill(0);
		return { values, anchor: previous };
	}

	for (let index = 0; index < values.length; index++) {
		if (labels[index] === selected.id) {
			continue;
		}

		// A different strong component is another person/object and is never feathered into the chosen subject.
		if (labels[index]) {
			values[index] = 0;
			continue;
		}

		if (!touchesSubjectComponent(labels, width, height, index, selected.id)) {
			values[index] = 0;
		}
	}

	return { values, anchor: { x: selected.x, y: selected.y } };
};

/** Prefer the replacement track's dimensions because a reused video element can still report the previous frame size. */
export const videoDimensions = (
	settings: Pick<MediaTrackSettings, 'width' | 'height'>,
	source: Pick<HTMLVideoElement, 'videoWidth' | 'videoHeight'>,
): { width: number; height: number } | undefined => {
	if (settings.width && settings.height) {
		return { width: settings.width, height: settings.height };
	}
	if (source.videoWidth && source.videoHeight) {
		return { width: source.videoWidth, height: source.videoHeight };
	}
	return undefined;
};

/** Prefer deterministic manual capture, with automatic capture as the compatibility fallback. */
export const captureCanvasTrack = (canvas: Pick<HTMLCanvasElement, 'captureStream'>): MediaStreamTrack | undefined => {
	const manual = canvas.captureStream(0).getVideoTracks()[0];
	const capture = manual as unknown as { requestFrame?: () => void } | undefined;
	if (capture?.requestFrame) {
		return manual;
	}

	// A zero-frame-rate track without requestFrame could never publish anything.
	manual?.stop();
	return canvas.captureStream().getVideoTracks()[0];
};

/** Canvas capture tracks are not portable across backing-store resizes in Chromium; recapture at the new size. */
export const refreshCapturedTrack = (
	canvas: Pick<HTMLCanvasElement, 'captureStream'>,
	current: MediaStreamTrack | undefined,
	resolutionChanged: boolean,
): MediaStreamTrack | undefined => {
	if (!resolutionChanged) {
		return current;
	}

	current?.stop();
	return captureCanvasTrack(canvas);
};

/** Canvas capture is manual so every completed WebGL render becomes exactly one outgoing video frame. */
export const requestCapturedFrame = (track: MediaStreamTrack | undefined): void => {
	const capture = track as unknown as { requestFrame?: () => void } | undefined;
	capture?.requestFrame?.();
};

/**
 * How often the mask is worked out again, in milliseconds.
 *
 * Not every frame. A segmentation is the expensive part of this by an order of magnitude — about 20ms of the 22ms a
 * blurred 1080p frame costs with the multiclass model — and it is the one part that does not have to happen at the
 * frame rate: between segmentations the last mask is reused, which is invisible on a talking head and shows only as
 * a soft edge trailing a fast wave. The initial 20Hz target adapts downward when measured model work would occupy too
 * much of the worker. Camera callbacks ultimately quantize it to about 15Hz on a 30fps track, which keeps motion
 * noticeably tighter without allowing inference requests to overlap.
 *
 * `0` segments every frame.
 */
export const SEGMENT_INTERVAL = 50;

const MAX_SEGMENT_INTERVAL = 120;
const TARGET_SEGMENTER_UTILIZATION = 0.6;
const SEGMENT_INTERVAL_STEP = 5;
const TARGET_FRAME_MS = 1000 / 30;
export const MAX_OUTPUT_FPS = 30;
const OUTPUT_FRAME_INTERVAL = 1000 / MAX_OUTPUT_FPS;

/** Camera devices commonly deliver 60fps even when the sender is configured for 30; do not composite discarded frames. */
export const shouldRenderFrame = (lastRenderedAt: number, now: number): boolean =>
	lastRenderedAt === 0 || now - lastRenderedAt >= OUTPUT_FRAME_INTERVAL - 1;

export type BackgroundBlurPerformance = {
	fps?: number;
	frameMs?: number;
	compositorMs?: number;
	segmentationMs?: number;
	segmentIntervalMs: number;
	qualityReduction: 0 | 1 | 2;
};

type SegmenterWorkerResult =
	| { type: 'ready'; labels: string[] }
	| { type: 'mask'; values: Float32Array; width: number; height: number; durationMs: number }
	| { type: 'error'; message: string };

/**
 * Protects the camera's frame budget without making quality jump up and down on an isolated slow frame.
 *
 * Segmentation cadence follows its measured cost: a 40ms model run should not be requested ten times a second on a
 * machine which cannot absorb that work. Compositor quality changes only after sustained pressure and recovers much
 * more slowly, so a busy tab degrades gracefully and a brief layout/repaint spike does not change the picture.
 */
export class BackgroundBlurFrameBudget {
	private qualityReduction: 0 | 1 | 2 = 0;

	private pressure = 0;

	private recoveryFrames = 0;

	private segmentIntervalMs = SEGMENT_INTERVAL;

	private frameMs?: number;

	private compositorMs?: number;

	private segmentationMs?: number;

	private fps?: number;

	private fpsWindowStartedAt?: number;

	private framesInWindow = 0;

	get renderQualityReduction(): 0 | 1 | 2 {
		return this.qualityReduction;
	}

	get segmentationInterval(): number {
		return this.segmentIntervalMs;
	}

	observeSegmentation(durationMs: number): void {
		this.segmentationMs = this.average(this.segmentationMs, durationMs, 0.2);
		// Keep segmentation below roughly 60% of one worker core. The latency includes transferring the resized frame,
		// synchronous MediaPipe inference/readback in the worker and transferring its model-sized confidence mask back.
		this.segmentIntervalMs = Math.min(
			MAX_SEGMENT_INTERVAL,
			Math.max(
				SEGMENT_INTERVAL,
				Math.ceil(this.segmentationMs / TARGET_SEGMENTER_UTILIZATION / SEGMENT_INTERVAL_STEP) * SEGMENT_INTERVAL_STEP,
			),
		);
	}

	observeFrame(frameMs: number, compositorMs: number, completedAt: number): void {
		this.frameMs = this.average(this.frameMs, frameMs, 0.12);
		this.compositorMs = this.average(this.compositorMs, compositorMs, 0.12);

		if (this.fpsWindowStartedAt === undefined) {
			this.fpsWindowStartedAt = completedAt;
		} else {
			this.framesInWindow++;
		}
		const elapsed = completedAt - this.fpsWindowStartedAt;
		if (elapsed >= 1000) {
			// Count completed frames over a real time window. Averaging 1 / frameInterval is badly biased upward when a
			// browser delivers callbacks in short bursts followed by an equivalent idle gap.
			this.fps = (this.framesInWindow * 1000) / elapsed;
			this.fpsWindowStartedAt = completedAt;
			this.framesInWindow = 0;
		}

		// Leave time for layout, capture and the WebRTC encoder inside a 30fps frame. Slow compositing frames add
		// pressure; inexpensive frames drain it, which distinguishes persistent overload from one-off scheduling noise.
		if (frameMs > TARGET_FRAME_MS * 0.75) {
			this.pressure = Math.min(12, this.pressure + 3);
			this.recoveryFrames = 0;
		} else if (frameMs > TARGET_FRAME_MS * 0.55) {
			this.pressure = Math.min(12, this.pressure + 1);
			this.recoveryFrames = 0;
		} else {
			this.pressure = Math.max(0, this.pressure - 1);
			this.recoveryFrames = this.pressure === 0 && frameMs < TARGET_FRAME_MS * 0.45 ? this.recoveryFrames + 1 : 0;
		}

		if (this.pressure >= 9 && this.qualityReduction < 2) {
			this.qualityReduction = (this.qualityReduction + 1) as 1 | 2;
			this.pressure = 0;
			this.recoveryFrames = 0;
		} else if (this.recoveryFrames >= 180 && this.qualityReduction > 0) {
			this.qualityReduction = (this.qualityReduction - 1) as 0 | 1;
			this.recoveryFrames = 0;
		}
	}

	snapshot(): BackgroundBlurPerformance {
		return {
			fps: this.fps,
			frameMs: this.frameMs,
			compositorMs: this.compositorMs,
			segmentationMs: this.segmentationMs,
			segmentIntervalMs: this.segmentIntervalMs,
			qualityReduction: this.qualityReduction,
		};
	}

	private average(previous: number | undefined, current: number, weight: number): number {
		return previous === undefined ? current : previous + (current - previous) * weight;
	}
}

/**
 * Blurs the background of a camera track, and nothing else.
 *
 * MediaPipe provides a low-resolution confidence matte and {@link BackgroundBlurRenderer} refines and composites it
 * on WebGL2. The renderer keeps the important stages on GPU: a joint bilateral upsample aligns the matte with camera
 * edges, a weighted separable blur excludes foreground colours, and the final blend happens at full frame size.
 *
 * This differs from both earlier implementations:
 *
 * - a binary category mask threw away partial coverage around hair before compositing began;
 * - blurring the complete frame let the person's colours bleed outwards into a halo;
 * - enlarging the blurred source to hide its canvas border moved the background relative to the sharp subject.
 *
 * Strength is a fraction of frame height — what has to look the same across resolutions is the blur *relative to
 * the picture*, since the same track is watched at whatever size the other end's tile happens to be. It can be
 * changed at any time with {@link setStrength} — the next frame uses it, so moving between levels costs nothing and
 * never re-publishes.
 *
 * Strength `0` is pass-through: frames keep flowing, untouched, and the segmenter is left alone. That is what
 * "no blur" does while the processor stays attached, since detaching a processor re-publishes the camera.
 */
export class BackgroundBlurProcessor implements TrackProcessor<Track.Kind.Video, VideoProcessorOptions> {
	/** Bump when an existing development-session processor must be reconstructed rather than updated in place. */
	static readonly revision = 13;

	readonly name = 'rocket-chat-background-blur';

	readonly revision = BackgroundBlurProcessor.revision;

	processedTrack?: MediaStreamTrack;

	private strength: number;

	private backgroundImage?: ImageBitmap;

	private segmenterWorker?: Worker;

	private source?: HTMLVideoElement;

	private ownsSource = false;

	private canvas?: HTMLCanvasElement;

	private renderer?: BackgroundBlurRenderer;

	/** Which confidence mask is the person. See {@link personConfidence}. */
	private person = { index: 0, invert: false };

	/** Centroid of the caller selected in the previous matte, used to reject people passing behind them. */
	private primarySubject?: PrimarySubjectAnchor;

	/** Flood-fill storage is reused; allocating two model-sized arrays per segmentation creates visible GC pressure. */
	private readonly primarySubjectScratch: PrimarySubjectScratch = {};

	/** Last matte at model resolution, used only to remove low-amplitude temporal flicker. */
	private temporalMask?: Uint8Array;

	private lastSegment = 0;

	private segmenting = false;

	private lastTimestamp = 0;

	private segmentStartedAt = 0;

	private lastRenderedAt = 0;

	private frameRequest?: number;

	private timer?: ReturnType<typeof setTimeout>;

	private stopped = false;

	private readonly frameBudget = new BackgroundBlurFrameBudget();

	readonly modelKey: SegmenterModelKey;

	constructor(strength = 0, modelKey: SegmenterModelKey = 'quality', backgroundImage?: ImageBitmap) {
		this.strength = strength;
		this.modelKey = modelKey;
		this.backgroundImage = backgroundImage;
	}

	/** Whether this browser can do it. The asking is in {@link supportsBackgroundBlur}, which a menu can call cheaply. */
	static get isSupported(): boolean {
		return supportsBackgroundBlur();
	}

	async init(options: VideoProcessorOptions): Promise<void> {
		this.stopped = false;

		this.source = options.element instanceof HTMLVideoElement ? options.element : document.createElement('video');
		this.ownsSource = this.source !== options.element;
		this.source.muted = true;
		this.source.playsInline = true;
		this.source.autoplay = true;
		this.source.srcObject = new MediaStream([options.track]);
		await this.source.play().catch(() => undefined);

		const { width, height } = await this.dimensions(options.track);

		// The canvas has to be in the document for its captured stream to keep producing frames — an offscreen one
		// stalls in some browsers — but nobody should see it.
		this.canvas = document.createElement('canvas');
		this.canvas.style.display = 'none';
		document.body.appendChild(this.canvas);
		this.renderer = new BackgroundBlurRenderer(this.canvas);
		this.renderer.resize(width, height);
		this.renderer.setBackgroundImage(this.backgroundImage);

		// Manual capture avoids depending on Chromium's canvas-dirty heuristic. That heuristic can stop observing WebGL
		// updates after a backing-store resize, leaving lower-resolution previews stuck on their initial black frame.
		this.processedTrack = captureCanvasTrack(this.canvas);

		await this.initSegmenterWorker();

		this.schedule();
	}

	/**
	 * Follows the track being replaced — a camera swap, or a new resolution.
	 *
	 * The canvas, its captured stream and the loaded segmenter all survive, so what the room is publishing does not
	 * change and nothing has to be renegotiated. Only where the frames come from does.
	 */
	async restart(options: VideoProcessorOptions): Promise<void> {
		this.unschedule();

		if (!this.source || !this.canvas) {
			return this.init(options);
		}

		this.source.srcObject = new MediaStream([options.track]);
		await this.source.play().catch(() => undefined);

		const { width, height } = await this.dimensions(options.track);
		const resolutionChanged = this.canvas.width !== width || this.canvas.height !== height;
		this.resize(width, height);
		if (resolutionChanged) {
			// Chromium can leave a canvas capture track black after its backing store changes size. LiveKit reads
			// processedTrack after restart() returns, so hand it a fresh capture at the new dimensions for sender and preview.
			this.processedTrack = refreshCapturedTrack(this.canvas, this.processedTrack, true);
			this.temporalMask = undefined;
			this.primarySubject = undefined;
			this.lastSegment = 0;
		}

		this.stopped = false;
		this.schedule();
	}

	async destroy(): Promise<void> {
		this.stopped = true;
		this.unschedule();

		this.processedTrack?.stop();
		this.processedTrack = undefined;

		this.renderer?.destroy();
		this.renderer = undefined;
		this.canvas?.remove();
		this.canvas = undefined;
		this.temporalMask = undefined;
		this.primarySubject = undefined;

		if (this.source) {
			this.source.srcObject = null;
			if (this.ownsSource) {
				this.source.remove();
			}
			this.source = undefined;
		}

		this.segmenterWorker?.postMessage({ type: 'close' });
		this.segmenterWorker?.terminate();
		this.segmenterWorker = undefined;
		this.segmenting = false;
	}

	/** Blur, as a fraction of frame height. `0` passes frames through untouched. */
	setStrength(strength: number): void {
		this.strength = strength;
	}

	/** Replace the background with this image, or return to blur/pass-through when omitted. */
	setBackgroundImage(image?: ImageBitmap): void {
		this.backgroundImage = image;
		this.renderer?.setBackgroundImage(image);
	}

	/** Current measured stage timings and the adaptive quality decisions made from them. */
	getPerformanceStats(): BackgroundBlurPerformance {
		return this.frameBudget.snapshot();
	}

	/** Waits for the camera to say how big its picture is, which it does not know the instant it is handed over. */
	private async dimensions(track?: MediaStreamTrack): Promise<{ width: number; height: number }> {
		const { source } = this;
		if (!source) {
			throw new Error('background blur has no camera to read');
		}

		const current = videoDimensions(track?.getSettings() ?? {}, source);
		if (current) {
			return current;
		}

		await new Promise<void>((resolve) => {
			const done = () => {
				source.removeEventListener('loadeddata', done);
				resolve();
			};
			source.addEventListener('loadeddata', done);
			// A camera that never fires the event should not leave a call without video for ever.
			setTimeout(done, 3000);
		});

		return videoDimensions(track?.getSettings() ?? {}, source) ?? { width: 640, height: 360 };
	}

	private resize(width: number, height: number): void {
		if (!this.canvas || (this.canvas.width === width && this.canvas.height === height)) {
			return;
		}

		this.renderer?.resize(width, height);
	}

	private async initSegmenterWorker(): Promise<void> {
		const model = SEGMENTER_BY_KEY[this.modelKey];
		// MediaPipe's WASM loader still calls importScripts(), which is forbidden inside a module worker. The classic
		// worker dynamically imports the ESM API bundle and keeps importScripts available for the generated WASM runtime.
		const worker = new Worker(SEGMENTER_WORKER, { name: 'rocket-chat-background-blur' });
		this.segmenterWorker = worker;

		await new Promise<void>((resolve, reject) => {
			const onMessage = ({ data }: MessageEvent<SegmenterWorkerResult>) => {
				if (data.type === 'ready') {
					worker.removeEventListener('message', onMessage);
					this.person = personConfidence(data.labels);
					resolve();
				} else if (data.type === 'error') {
					worker.removeEventListener('message', onMessage);
					reject(new Error(data.message));
				}
			};
			worker.addEventListener('message', onMessage);
			worker.addEventListener('error', () => reject(new Error('background blur worker could not start')), { once: true });
			worker.postMessage({
				type: 'init',
				wasmUrl: SEGMENTER_WASM,
				modelUrl: model.url,
				width: model.input.width,
				height: model.input.height,
			});
		});

		worker.addEventListener('message', this.handleSegmenterMessage);
	}

	private readonly handleSegmenterMessage = ({ data }: MessageEvent<SegmenterWorkerResult>): void => {
		if (data.type === 'mask') {
			const stable = stabilizeConfidenceMask(data.values, this.temporalMask, this.person.invert);
			const primary = isolatePrimarySubject(stable, data.width, data.height, this.primarySubject, this.primarySubjectScratch);
			this.temporalMask = primary.values;
			this.primarySubject = primary.anchor;
			this.renderer?.uploadMask(this.temporalMask, data.width, data.height);
			this.frameBudget.observeSegmentation(performance.now() - this.segmentStartedAt);
			this.segmenting = false;
		} else if (data.type === 'error') {
			this.frameBudget.observeSegmentation(performance.now() - this.segmentStartedAt);
			this.segmenting = false;
			console.warn('background blur could not segment a frame', data.message);
		}
	};

	private schedule(): void {
		const { source } = this;
		if (!source || this.stopped) {
			return;
		}

		const step = (now = performance.now()) => {
			if (this.timer !== undefined) {
				clearTimeout(this.timer);
				this.timer = undefined;
			}
			this.frameRequest = undefined;
			if (shouldRenderFrame(this.lastRenderedAt, now)) {
				this.lastRenderedAt = now;
				this.render();
			}
			this.schedule();
		};

		// Driven by the camera's own frames where the browser will say when they arrive, so the output has the same
		// rate as the input and no frame is drawn twice. Chromium can strand that callback when the video's srcObject
		// changes resolution, so a watchdog keeps the canvas stream alive until frame callbacks resume.
		if ('requestVideoFrameCallback' in source) {
			this.frameRequest = source.requestVideoFrameCallback(step);
			this.timer = setTimeout(() => {
				if (this.frameRequest !== undefined) {
					source.cancelVideoFrameCallback?.(this.frameRequest);
				}
				step();
			}, 100);
			return;
		}

		this.timer = setTimeout(step, 1000 / 30);
	}

	private unschedule(): void {
		if (this.frameRequest !== undefined) {
			this.source?.cancelVideoFrameCallback?.(this.frameRequest);
			this.frameRequest = undefined;
		}
		if (this.timer !== undefined) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}
	}

	private render(): void {
		const { source } = this;
		const { renderer } = this;
		if (!source || !renderer || this.stopped || !source.videoWidth) {
			return;
		}

		const frameStartedAt = performance.now();
		if (this.strength || this.backgroundImage) {
			this.segment();
		}
		const radius = this.strength ? Math.max(1, Math.round(this.strength * (this.canvas?.height ?? source.videoHeight))) : 0;
		const compositorStartedAt = performance.now();
		renderer.render(source, radius, this.frameBudget.renderQualityReduction);
		const completedAt = performance.now();
		this.frameBudget.observeFrame(completedAt - frameStartedAt, completedAt - compositorStartedAt, completedAt);
		requestCapturedFrame(this.processedTrack);
	}

	/**
	 * Works out where the person is, if it is time to.
	 *
	 * The frame is scaled down to the model's own input size first, and *that* is what gets segmented. It costs a draw
	 * and saves an enormous amount: MediaPipe hands back a mask the size of what it was given, and reading a
	 * 1920×1080 mask off the GPU took 60ms a frame where a 256×256 one is far cheaper. Nothing is lost by it — the
	 * model resizes its input to exactly this size anyway, so a frame-sized mask was only ever its own output
	 * stretched back up, and we stretch it ourselves when compositing. The resized ImageBitmap is transferred to a
	 * dedicated worker so the remaining synchronous model inference and mask readback do not interrupt UI or encoding.
	 */
	private segment(): void {
		const { source, segmenterWorker } = this;
		if (!source || !segmenterWorker) {
			return;
		}

		const now = performance.now();
		if (now - this.lastSegment < this.frameBudget.segmentationInterval) {
			return;
		}

		// One at a time: asking for another segmentation while one is in flight throws, and the last mask is a frame
		// old at worst.
		if (this.segmenting) {
			return;
		}

		this.segmenting = true;
		this.lastSegment = now;
		this.segmentStartedAt = performance.now();

		const timestamp = Math.max(this.lastTimestamp + 1, now);
		this.lastTimestamp = timestamp;
		const model = SEGMENTER_BY_KEY[this.modelKey];

		void createImageBitmap(source, { resizeWidth: model.input.width, resizeHeight: model.input.height, resizeQuality: 'low' })
			.then((frame) => {
				if (this.stopped || segmenterWorker !== this.segmenterWorker) {
					frame.close();
					this.segmenting = false;
					return;
				}
				segmenterWorker.postMessage({ type: 'segment', frame, timestamp, personIndex: this.person.index }, [frame]);
			})
			.catch((err: unknown) => {
				this.segmenting = false;
				console.warn('background blur could not copy a frame for segmentation', err);
			});
	}
}
