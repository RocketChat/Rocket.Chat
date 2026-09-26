import {
	BackgroundBlurFrameBudget,
	captureCanvasTrack,
	isolatePrimarySubject,
	personConfidence,
	refreshCapturedTrack,
	requestCapturedFrame,
	shouldRenderFrame,
	stabilizeConfidenceMask,
	videoDimensions,
} from './backgroundBlurProcessor';

it('uses the inverse background confidence for the multiclass model', () => {
	expect(personConfidence(['background', 'hair', 'body-skin', 'face-skin', 'clothes', 'others'])).toEqual({ index: 0, invert: true });
});

it('uses the selfie confidence directly for the landscape model', () => {
	expect(personConfidence(['selfie'])).toEqual({ index: 0, invert: false });
});

it('falls back to the first direct confidence mask for an unknown model', () => {
	expect(personConfidence([])).toEqual({ index: 0, invert: false });
});

it('preserves continuous confidence instead of reducing the matte to two categories', () => {
	expect(stabilizeConfidenceMask(new Float32Array([0, 0.25, 0.5, 0.75, 1]), undefined, false)).toEqual(
		new Uint8Array([0, 5, 128, 250, 255]),
	);
});

it('can derive person alpha from background confidence', () => {
	expect(stabilizeConfidenceMask(new Float32Array([0, 0.25, 1]), undefined, true)).toEqual(new Uint8Array([255, 250, 0]));
});

it('removes weak foreground confidence that would leak sharp room details over the blur', () => {
	expect(stabilizeConfidenceMask(new Float32Array([0.1, 0.2, 0.3]), undefined, false)).toEqual(new Uint8Array([0, 0, 19]));
});

it('damps small confidence jitter but accepts real motion immediately', () => {
	const previous = new Uint8Array([128, 0]);
	const next = stabilizeConfidenceMask(new Float32Array([0.6, 1]), previous, false);

	expect(next).toBe(previous);
	expect(next[0]).toBe(174);
	expect(next[1]).toBe(255);
});

it('keeps the centred caller and removes a separate person at the frame edge', () => {
	const mask = new Uint8Array([
		255, 255, 0, 0, 0, 0, 0, 255, 255, 0, 0, 255, 255, 0, 255, 255, 0, 0, 255, 255, 0, 0, 0, 0, 0, 255, 255, 0, 0, 0, 0, 0, 255, 255, 0,
	]);

	const { values, anchor } = isolatePrimarySubject(mask, 7, 5);

	expect(anchor?.x).toBeGreaterThan(0.5);
	expect([0, 1, 7, 8, 14, 15].map((index) => values[index])).toEqual([0, 0, 0, 0, 0, 0]);
	expect(values[18]).toBe(255);
});

it('preserves a lone caller within the broad initial subject region', () => {
	const mask = new Uint8Array([0, 255, 255, 0, 0, 0, 255, 255, 0, 0]);

	const { values } = isolatePrimarySubject(mask, 5, 2);

	expect(values).toEqual(mask);
});

it('does not acquire a new subject who appears only at the frame border', () => {
	const mask = new Uint8Array([255, 255, 0, 0, 0, 0, 0, 0, 0, 0]);

	const { values, anchor } = isolatePrimarySubject(mask, 10, 1);

	expect(values).toEqual(new Uint8Array(10));
	expect(anchor).toBeUndefined();
});

it('does not let a distant component replace the tracked caller', () => {
	const mask = new Uint8Array([255, 255, 0, 0, 0, 0, 0, 0, 0, 0]);
	const previous = { x: 0.55, y: 0.5 };

	const { values, anchor } = isolatePrimarySubject(mask, 10, 1, previous);

	expect(values).toEqual(new Uint8Array(10));
	expect(anchor).toBe(previous);
});

it('retains soft hair edges only around the selected subject', () => {
	const mask = new Uint8Array([24, 255, 0, 0, 24, 255, 0]);

	const { values } = isolatePrimarySubject(mask, 7, 1, { x: 0.15, y: 0.5 });

	expect([...values]).toEqual([24, 255, 0, 0, 0, 0, 0]);
});

it('adapts segmentation cadence to keep model work near three fifths of a worker core', () => {
	const budget = new BackgroundBlurFrameBudget();

	budget.observeSegmentation(8);
	expect(budget.segmentationInterval).toBe(50);

	const expensiveBudget = new BackgroundBlurFrameBudget();
	expensiveBudget.observeSegmentation(40);
	expect(expensiveBudget.segmentationInterval).toBe(70);

	const overloadedBudget = new BackgroundBlurFrameBudget();
	overloadedBudget.observeSegmentation(100);
	expect(overloadedBudget.segmentationInterval).toBe(120);
});

it('reduces compositor work only under sustained frame pressure and recovers slowly', () => {
	const budget = new BackgroundBlurFrameBudget();

	for (let frame = 0; frame < 3; frame++) {
		budget.observeFrame(30, 20, frame * 33);
	}
	expect(budget.renderQualityReduction).toBe(1);

	for (let frame = 3; frame < 6; frame++) {
		budget.observeFrame(30, 20, frame * 33);
	}
	expect(budget.renderQualityReduction).toBe(2);

	for (let frame = 6; frame < 186; frame++) {
		budget.observeFrame(5, 3, frame * 33);
	}
	expect(budget.renderQualityReduction).toBe(1);
});

it('reports measured processor FPS and stage timings', () => {
	const budget = new BackgroundBlurFrameBudget();
	budget.observeSegmentation(20);
	for (let frame = 0; frame <= 30; frame++) {
		budget.observeFrame(frame === 30 ? 10 : 8, frame === 30 ? 4 : 3, 1000 + (frame * 1000) / 30);
	}

	const stats = budget.snapshot();
	expect(stats.fps).toBeCloseTo(30);
	expect(stats.frameMs).toBeGreaterThan(8);
	expect(stats.compositorMs).toBeGreaterThan(3);
	expect(stats.segmentationMs).toBe(20);
});

it('caps compositor work at 30fps when the camera delivers 60fps', () => {
	expect(shouldRenderFrame(0, 1000)).toBe(true);
	expect(shouldRenderFrame(1000, 1000 + 1000 / 60)).toBe(false);
	expect(shouldRenderFrame(1000, 1000 + 1000 / 30)).toBe(true);
});

it('uses replacement-track dimensions instead of a stale video element after a resolution change', () => {
	expect(videoDimensions({ width: 640, height: 360 }, { videoWidth: 1280, videoHeight: 720 })).toEqual({ width: 640, height: 360 });
});

it('falls back to video dimensions when track settings are not available', () => {
	expect(videoDimensions({}, { videoWidth: 320, videoHeight: 180 })).toEqual({ width: 320, height: 180 });
});

it('recreates the captured output track when the canvas resolution changes', () => {
	const current = { stop: jest.fn() } as unknown as MediaStreamTrack;
	const replacement = { requestFrame: jest.fn() } as unknown as MediaStreamTrack;
	const captureStream = jest.fn(() => ({ getVideoTracks: () => [replacement] }));
	const canvas = { captureStream } as unknown as HTMLCanvasElement;

	expect(refreshCapturedTrack(canvas, current, true)).toBe(replacement);
	expect(current.stop).toHaveBeenCalledTimes(1);
	expect(captureStream).toHaveBeenCalledWith(0);
});

it('keeps the captured output track while dimensions stay unchanged', () => {
	const current = { stop: jest.fn() } as unknown as MediaStreamTrack;
	const canvas = { captureStream: jest.fn() } as unknown as HTMLCanvasElement;

	expect(refreshCapturedTrack(canvas, current, false)).toBe(current);
	expect(current.stop).not.toHaveBeenCalled();
	expect(canvas.captureStream).not.toHaveBeenCalled();
});

it('falls back to automatic canvas capture where manual frame requests are unavailable', () => {
	const manual = { stop: jest.fn() } as unknown as MediaStreamTrack;
	const automatic = {} as MediaStreamTrack;
	const captureStream = jest
		.fn()
		.mockReturnValueOnce({ getVideoTracks: () => [manual] })
		.mockReturnValueOnce({ getVideoTracks: () => [automatic] });

	expect(captureCanvasTrack({ captureStream } as unknown as HTMLCanvasElement)).toBe(automatic);
	expect(captureStream).toHaveBeenNthCalledWith(1, 0);
	expect(captureStream).toHaveBeenNthCalledWith(2);
	expect(manual.stop).toHaveBeenCalledTimes(1);
});

it('explicitly publishes each completed WebGL frame to the canvas capture track', () => {
	const requestFrame = jest.fn();
	const track = { requestFrame } as unknown as MediaStreamTrack;

	requestCapturedFrame(track);

	expect(requestFrame).toHaveBeenCalledTimes(1);
});
