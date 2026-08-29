import { supportsBackgroundBlur } from './backgroundBlurSupport';

type FakeCanvas = { getContext: (kind: string) => unknown };

const canvasThat = ({ webgl2 = true }: { webgl2?: boolean } = {}): FakeCanvas => ({
	getContext: (kind: string) => (kind === 'webgl2' && webgl2 ? {} : null),
});

const use = (canvas: FakeCanvas) => jest.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement);

const originalWorker = Object.getOwnPropertyDescriptor(globalThis, 'Worker');
const originalOffscreenCanvas = Object.getOwnPropertyDescriptor(globalThis, 'OffscreenCanvas');
const originalCreateImageBitmap = Object.getOwnPropertyDescriptor(globalThis, 'createImageBitmap');

const restoreProperty = (name: PropertyKey, descriptor: PropertyDescriptor | undefined) => {
	if (descriptor) {
		Object.defineProperty(globalThis, name, descriptor);
		return;
	}
	Reflect.deleteProperty(globalThis, name);
};

beforeEach(() => {
	Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', { value: jest.fn(), configurable: true });
	Object.defineProperty(globalThis, 'Worker', { value: class {}, configurable: true });
	Object.defineProperty(globalThis, 'OffscreenCanvas', { value: class {}, configurable: true });
	Object.defineProperty(globalThis, 'createImageBitmap', { value: jest.fn(), configurable: true });
});

afterEach(() => {
	jest.restoreAllMocks();
	delete (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream;
	restoreProperty('Worker', originalWorker);
	restoreProperty('OffscreenCanvas', originalOffscreenCanvas);
	restoreProperty('createImageBitmap', originalCreateImageBitmap);
});

it('says yes where the worker pipeline can capture images and a WebGL2 canvas can be captured', () => {
	use(canvasThat());

	expect(supportsBackgroundBlur()).toBe(true);
});

// MediaPipe's GPU delegate needs it, and its CPU one cannot hold 30fps at these sizes.
it('says no without WebGL2', () => {
	use(canvasThat({ webgl2: false }));

	expect(supportsBackgroundBlur()).toBe(false);
});

it('says no where a canvas cannot be captured as a track', () => {
	use(canvasThat());
	delete (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream;

	expect(supportsBackgroundBlur()).toBe(false);
});

it.each(['Worker', 'OffscreenCanvas', 'createImageBitmap'] as const)('says no without %s', (feature) => {
	use(canvasThat());
	Object.defineProperty(globalThis, feature, { value: undefined, configurable: true });

	expect(supportsBackgroundBlur()).toBe(false);
});
