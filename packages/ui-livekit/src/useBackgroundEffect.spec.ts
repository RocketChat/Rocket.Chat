import { MAX_BACKGROUND_IMAGES } from '@rocket.chat/ui-conference';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { LocalVideoTrack } from 'livekit-client';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { useBackgroundEffect } from './useBackgroundEffect';

let processorsSupported = true;

let imagesLoad = true;

const mockSwitchTo = jest.fn(async () => undefined);

jest.mock('@livekit/track-processors', () => {
	class BackgroundProcessorWrapper {
		switchTo = mockSwitchTo;

		constructor(public options: unknown) {}
	}
	return {
		BackgroundProcessorWrapper,
		BackgroundProcessor: jest.fn((options: unknown) => new BackgroundProcessorWrapper(options)),
		supportsBackgroundProcessors: () => processorsSupported,
	};
});

const dispatchToastMessage = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	useToastMessageDispatch: () => dispatchToastMessage,
	useEndpoint: () => async () => ({ backgrounds: [{ id: 'office', url: '/backgrounds/office' }] }),
}));

const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: new QueryClient() }, children);

const { BackgroundProcessor } = jest.requireMock('@livekit/track-processors');

const makeTrack = ({ setProcessorFails = false } = {}) => {
	let processor: unknown;
	const track = {
		getProcessor: () => processor,
		setProcessor: jest.fn(async (next: unknown) => {
			if (setProcessorFails) {
				throw new Error('no webgl');
			}
			processor = next;
		}),
		stopProcessor: jest.fn(async () => {
			processor = undefined;
		}),
	};
	return track as typeof track & LocalVideoTrack;
};

const settled = (result: { current: { applying?: unknown } }) => waitFor(() => expect(result.current.applying).toBeUndefined());

beforeEach(() => {
	jest.clearAllMocks();
	processorsSupported = true;
	jest.spyOn(console, 'warn').mockImplementation(() => undefined);
	URL.createObjectURL = jest.fn(() => 'blob:uploaded');
	URL.revokeObjectURL = jest.fn();
	globalThis.createImageBitmap = jest.fn(async () => ({ width: 1280, height: 720, close: jest.fn() }) as unknown as ImageBitmap);
	imagesLoad = true;
	globalThis.Image = class {
		onload?: () => void;

		onerror?: () => void;

		set src(_url: string) {
			queueMicrotask(() => (imagesLoad ? this.onload?.() : this.onerror?.()));
		}
	} as unknown as typeof Image;
});

it('loads the segmenter from the workspace when blur is chosen', async () => {
	const track = makeTrack();
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });

	await act(async () => result.current.select({ mode: 'blur' }));
	await settled(result);

	expect(BackgroundProcessor).toHaveBeenCalledWith(
		expect.objectContaining({
			mode: 'background-blur',
			assetPaths: { tasksVisionFileSet: '/segmentation', modelAssetPath: '/segmentation/selfie_multiclass_256x256_fp16.tflite' },
		}),
		'background-effect',
	);
	expect(result.current.current).toEqual({ mode: 'blur' });
});

// Restarting the camera to change effect would flash it off for the people watching.
it('switches a running effect in place rather than starting another', async () => {
	const track = makeTrack();
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });
	await act(async () => result.current.select({ mode: 'blur' }));
	await settled(result);

	await act(async () => result.current.uploadImage?.(new File([''], 'beach.png')));
	await settled(result);

	expect(track.setProcessor).toHaveBeenCalledTimes(1);
	expect(mockSwitchTo).toHaveBeenCalledWith({ mode: 'virtual-background', imagePath: 'blob:uploaded' });
	expect(result.current).toMatchObject({ current: { mode: 'image', imageUrl: 'blob:uploaded' }, images: ['blob:uploaded'] });
});

it('keeps the running effect when the next one cannot start', async () => {
	const track = makeTrack();
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });
	await act(async () => result.current.select({ mode: 'blur' }));
	await settled(result);

	mockSwitchTo.mockRejectedValueOnce(new Error('the image would not load'));
	await act(async () => result.current.uploadImage?.(new File([''], 'beach.png')));
	await settled(result);

	expect(mockSwitchTo).toHaveBeenLastCalledWith({ mode: 'background-blur', blurRadius: 10 });
	expect(track.stopProcessor).not.toHaveBeenCalled();
	expect(result.current.current).toEqual({ mode: 'blur' });
});

// The processor would run without a background it could not load, and send the camera as it is.
it('puts no image on the camera that could not be loaded', async () => {
	imagesLoad = false;
	const track = makeTrack();
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });

	await act(async () => result.current.uploadImage?.(new File([''], 'beach.png')));
	await settled(result);

	expect(track.setProcessor).not.toHaveBeenCalled();
	expect(result.current.current).toEqual({ mode: 'none' });
});

it('turns away an image the browser cannot read, before the camera gets it', async () => {
	(globalThis.createImageBitmap as jest.Mock).mockRejectedValueOnce(new Error('not an image'));
	const track = makeTrack();
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });

	await act(async () => result.current.uploadImage?.(new File([''], 'photo.heic')));

	expect(result.current.images).toEqual([]);
	expect(track.setProcessor).not.toHaveBeenCalled();
	expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: 'Camera_background_image_unreadable' });
});

it('knows whether this browser can run an effect before one is chosen', async () => {
	processorsSupported = false;
	const { result } = renderHook(() => useBackgroundEffect(makeTrack(), '/segmentation'), { wrapper });

	await waitFor(() => expect(result.current.supported).toBe(false));
});

it('takes no image that was not uploaded for this call', async () => {
	const track = makeTrack();
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });

	await act(async () => result.current.select({ mode: 'image', imageUrl: 'blob:elsewhere' }));

	expect(track.setProcessor).not.toHaveBeenCalled();
	expect(result.current.current).toEqual({ mode: 'none' });
});

it('takes the effect off the camera when none is chosen', async () => {
	const track = makeTrack();
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });
	await act(async () => result.current.select({ mode: 'blur' }));
	await settled(result);

	await act(async () => result.current.select({ mode: 'none' }));
	await settled(result);

	expect(track.stopProcessor).toHaveBeenCalled();
	expect(result.current.current).toEqual({ mode: 'none' });
});

it('withdraws the effects where this browser cannot run them', async () => {
	processorsSupported = false;
	const track = makeTrack();
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });

	await act(async () => result.current.select({ mode: 'blur' }));
	await settled(result);

	expect(track.setProcessor).not.toHaveBeenCalled();
	expect(result.current).toMatchObject({ current: { mode: 'none' }, supported: false });
});

it('leaves the camera as it was when the effect cannot start', async () => {
	const track = makeTrack({ setProcessorFails: true });
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });

	await act(async () => result.current.select({ mode: 'blur' }));
	await settled(result);

	expect(result.current).toMatchObject({ current: { mode: 'none' }, supported: true });
});

it('puts the running effect on a camera that replaces the previous one', async () => {
	const first = makeTrack();
	const { result, rerender } = renderHook(({ track }) => useBackgroundEffect(track, '/segmentation'), {
		initialProps: { track: first },
		wrapper,
	});
	await act(async () => result.current.select({ mode: 'blur' }));
	await settled(result);

	const second = makeTrack();
	rerender({ track: second });
	await settled(result);

	await waitFor(() => expect(second.setProcessor).toHaveBeenCalled());
	expect(result.current.current).toEqual({ mode: 'blur' });
});

it('keeps every uploaded image to switch between', async () => {
	const track = makeTrack();
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });
	(URL.createObjectURL as jest.Mock).mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');

	await act(async () => result.current.uploadImage?.(new File([''], 'first.png')));
	await settled(result);
	await act(async () => result.current.uploadImage?.(new File([''], 'second.png')));
	await settled(result);
	await act(async () => result.current.select({ mode: 'image', imageUrl: 'blob:first' }));
	await settled(result);

	expect(result.current.images).toEqual(['blob:first', 'blob:second']);
	expect(result.current.current).toEqual({ mode: 'image', imageUrl: 'blob:first' });
	expect(URL.revokeObjectURL).not.toHaveBeenCalled();
});

it('takes the background off when the image in use is removed, and only then lets the image go', async () => {
	const track = makeTrack();
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });
	await act(async () => result.current.uploadImage?.(new File([''], 'beach.png')));
	await settled(result);

	let stopped = () => undefined as void;
	track.stopProcessor.mockImplementationOnce(
		() =>
			new Promise<void>((resolve) => {
				stopped = resolve;
			}),
	);
	await act(async () => result.current.removeImage?.('blob:uploaded'));

	expect(result.current.images).toEqual([]);
	expect(URL.revokeObjectURL).not.toHaveBeenCalled();

	await act(async () => stopped());
	await settled(result);

	expect(result.current.current).toEqual({ mode: 'none' });
	expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:uploaded');
});

it('takes no more images than the panel offers', async () => {
	const track = makeTrack();
	const { result } = renderHook(() => useBackgroundEffect(track, '/segmentation'), { wrapper });
	(URL.createObjectURL as jest.Mock).mockImplementation(() => `blob:${Math.random()}`);

	for (let i = 0; i <= MAX_BACKGROUND_IMAGES; i++) {
		await act(async () => result.current.uploadImage?.(new File([''], `${i}.png`)));
		await settled(result);
	}

	expect(result.current.images).toHaveLength(MAX_BACKGROUND_IMAGES);
});
