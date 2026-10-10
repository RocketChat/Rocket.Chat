import type { VideoQuality } from '@rocket.chat/ui-conference';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { LocalVideoTrack } from 'livekit-client';
import { VideoPresets, createLocalVideoTrack } from 'livekit-client';

import { usePreviewVideoTrack } from './usePreviewVideoTrack';

const assets = {
	workerUrl: '/worker.js',
	visionBundleUrl: '/vision_bundle.mjs',
	wasmBaseUrl: '/wasm',
	modelUrls: { quality: '/quality.tflite', performance: '/performance.tflite' },
	rnnoiseBaseUrl: '/rnnoise',
};

jest.mock('livekit-client', () => ({
	...jest.requireActual('livekit-client'),
	createLocalVideoTrack: jest.fn(),
}));

const mockedCreateLocalVideoTrack = jest.mocked(createLocalVideoTrack);

const makeTrack = () => {
	const mediaStreamTrack = Object.assign(new EventTarget(), { readyState: 'live', getSettings: () => ({ deviceId: 'brio' }) });
	const stop = jest.fn(() => {
		mediaStreamTrack.readyState = 'ended';
	});
	return {
		stop,
		mediaStreamTrack,
		restartTrack: jest.fn().mockResolvedValue(undefined),
		getProcessor: jest.fn(),
	} as unknown as LocalVideoTrack;
};

beforeEach(() => {
	mockedCreateLocalVideoTrack.mockReset();
});

it('opens the chosen camera, and stops it when the preflight goes', async () => {
	const track = makeTrack();
	mockedCreateLocalVideoTrack.mockResolvedValue(track);

	const { result, unmount } = renderHook(() => usePreviewVideoTrack(true, { deviceId: 'brio' }, assets));

	await waitFor(() => expect(result.current.track).toBe(track));
	expect(mockedCreateLocalVideoTrack).toHaveBeenCalledWith({ deviceId: 'brio' });

	unmount();
	expect(track.stop).toHaveBeenCalledTimes(1);
});

// A camera that is off in the preflight must not light up just to be previewed.
it('opens nothing while the camera is off', () => {
	const { result } = renderHook(() => usePreviewVideoTrack(false, {}, assets));

	expect(mockedCreateLocalVideoTrack).not.toHaveBeenCalled();
	expect(result.current.track).toBeUndefined();
});

it('tells whoever needs to know once the camera is open', async () => {
	mockedCreateLocalVideoTrack.mockResolvedValue(makeTrack());
	const onOpen = jest.fn();

	renderHook(() => usePreviewVideoTrack(true, { onOpen }, assets));

	await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1));
});

// A failure is about the camera that was asked for: turning it off is not still failing.
it('stops reporting a failure once the camera is turned off', async () => {
	mockedCreateLocalVideoTrack.mockRejectedValue(new Error('NotAllowedError'));

	const { result, rerender } = renderHook(({ enabled }) => usePreviewVideoTrack(enabled, {}, assets), { initialProps: { enabled: true } });
	await waitFor(() => expect(result.current.error).toBe(true));

	rerender({ enabled: false });
	expect(result.current.error).toBe(false);
});

// The track left over from before is stopped; showing it would be a black frame.
it('does not show the stopped track again when the camera comes back on', async () => {
	const first = makeTrack();
	mockedCreateLocalVideoTrack.mockResolvedValueOnce(first).mockReturnValueOnce(new Promise(() => undefined));

	const { result, rerender } = renderHook(({ enabled }) => usePreviewVideoTrack(enabled, {}, assets), { initialProps: { enabled: true } });
	await waitFor(() => expect(result.current.track).toBe(first));

	rerender({ enabled: false });
	rerender({ enabled: true });
	expect(result.current.track).toBeUndefined();
});

// An unplugged camera's last frame is not a preview: the screen says it is gone.
it('drops the camera that ends on its own', async () => {
	const track = makeTrack();
	mockedCreateLocalVideoTrack.mockResolvedValue(track);

	const { result } = renderHook(() => usePreviewVideoTrack(true, {}, assets));
	await waitFor(() => expect(result.current.track).toBe(track));

	act(() => {
		track.mediaStreamTrack.dispatchEvent(new Event('ended'));
	});
	expect(result.current.track).toBeUndefined();
	expect(result.current.error).toBe(true);
});

it('restarts the attached preview track instead of replacing it when resolution changes', async () => {
	const track = makeTrack();
	mockedCreateLocalVideoTrack.mockResolvedValue(track);

	const { result, rerender, unmount } = renderHook(({ quality }) => usePreviewVideoTrack(true, { quality }, assets), {
		initialProps: { quality: 'h720' as VideoQuality },
	});

	await waitFor(() => expect(result.current.track).toBe(track));

	rerender({ quality: 'h180' });

	await waitFor(() => expect(track.restartTrack).toHaveBeenCalledWith({ resolution: VideoPresets.h180.resolution, deviceId: 'brio' }));
	expect(mockedCreateLocalVideoTrack).toHaveBeenCalledTimes(1);
	expect(track.stop).not.toHaveBeenCalled();
	expect(result.current.track).toBe(track);

	unmount();
	expect(track.stop).toHaveBeenCalledTimes(1);
});

it('opens the initial preview at the selected resolution without an unnecessary restart', async () => {
	const track = makeTrack();
	mockedCreateLocalVideoTrack.mockResolvedValue(track);

	const { result } = renderHook(() => usePreviewVideoTrack(true, { quality: 'h360' }, assets));

	await waitFor(() => expect(result.current.track).toBe(track));

	expect(mockedCreateLocalVideoTrack).toHaveBeenCalledWith({ resolution: VideoPresets.h360.resolution });
	expect(track.restartTrack).not.toHaveBeenCalled();
});

// Trying again is not failing again: the note waits for this attempt's own answer.
it('does not show the last failure while the next attempt is still opening', async () => {
	mockedCreateLocalVideoTrack.mockRejectedValueOnce(new Error('NotReadableError')).mockReturnValueOnce(new Promise(() => undefined));

	const { result, rerender } = renderHook(({ deviceId }) => usePreviewVideoTrack(true, { deviceId }, assets), {
		initialProps: { deviceId: 'brio' },
	});
	await waitFor(() => expect(result.current.error).toBe(true));

	rerender({ deviceId: 'facetime' });
	expect(result.current.error).toBe(false);
});

// The previous camera is stopped the moment another is chosen; its last frame is not a preview of anything.
it('shows no camera while the newly chosen one opens', async () => {
	const first = makeTrack();
	mockedCreateLocalVideoTrack.mockResolvedValueOnce(first).mockReturnValueOnce(new Promise(() => undefined));

	const { result, rerender } = renderHook(({ deviceId }) => usePreviewVideoTrack(true, { deviceId }, assets), {
		initialProps: { deviceId: 'brio' },
	});
	await waitFor(() => expect(result.current.track).toBe(first));

	rerender({ deviceId: 'facetime' });
	expect(first.stop).toHaveBeenCalled();
	expect(result.current.track).toBeUndefined();
});
