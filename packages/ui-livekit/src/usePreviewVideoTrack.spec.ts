import type { VideoQuality } from '@rocket.chat/ui-conference';
import { renderHook, waitFor } from '@testing-library/react';
import type { LocalVideoTrack } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';

import { usePreviewVideoTrack } from './usePreviewVideoTrack';

jest.mock('livekit-client', () => ({
	createLocalVideoTrack: jest.fn(),
}));

const mockedCreateLocalVideoTrack = jest.mocked(createLocalVideoTrack);

const makeTrack = () => {
	const mediaStreamTrack = { readyState: 'live' };
	const stop = jest.fn(() => {
		mediaStreamTrack.readyState = 'ended';
	});
	return { stop, mediaStreamTrack, restartTrack: jest.fn().mockResolvedValue(undefined) } as unknown as LocalVideoTrack;
};

beforeEach(() => {
	mockedCreateLocalVideoTrack.mockReset();
});

it('opens the chosen camera, and stops it when the preflight goes', async () => {
	const track = makeTrack();
	mockedCreateLocalVideoTrack.mockResolvedValue(track);

	const { result, unmount } = renderHook(() => usePreviewVideoTrack(true, { deviceId: 'brio' }));

	await waitFor(() => expect(result.current.track).toBe(track));
	expect(mockedCreateLocalVideoTrack).toHaveBeenCalledWith({ deviceId: { exact: 'brio' } });

	unmount();
	expect(track.stop).toHaveBeenCalledTimes(1);
});

// A camera that is off in the preflight must not light up just to be previewed.
it('opens nothing while the camera is off', () => {
	const { result } = renderHook(() => usePreviewVideoTrack(false, {}));

	expect(mockedCreateLocalVideoTrack).not.toHaveBeenCalled();
	expect(result.current.track).toBeUndefined();
});

it('tells whoever needs to know once the camera is open', async () => {
	mockedCreateLocalVideoTrack.mockResolvedValue(makeTrack());
	const onOpen = jest.fn();

	renderHook(() => usePreviewVideoTrack(true, { onOpen }));

	await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1));
});

// A failure is about the camera that was asked for: turning it off is not still failing.
it('stops reporting a failure once the camera is turned off', async () => {
	mockedCreateLocalVideoTrack.mockRejectedValue(new Error('NotAllowedError'));

	const { result, rerender } = renderHook(({ enabled }) => usePreviewVideoTrack(enabled, {}), { initialProps: { enabled: true } });
	await waitFor(() => expect(result.current.error).toBe(true));

	rerender({ enabled: false });
	expect(result.current.error).toBe(false);
});

// The track left over from before is stopped; showing it would be a black frame.
it('does not show the stopped track again when the camera comes back on', async () => {
	const first = makeTrack();
	mockedCreateLocalVideoTrack.mockResolvedValueOnce(first).mockReturnValueOnce(new Promise(() => undefined));

	const { result, rerender } = renderHook(({ enabled }) => usePreviewVideoTrack(enabled, {}), { initialProps: { enabled: true } });
	await waitFor(() => expect(result.current.track).toBe(first));

	rerender({ enabled: false });
	rerender({ enabled: true });
	expect(result.current.track).toBeUndefined();
});

it('restarts the attached preview track instead of replacing it when resolution changes', async () => {
	const track = makeTrack();
	mockedCreateLocalVideoTrack.mockResolvedValue(track);

	const { result, rerender, unmount } = renderHook(({ quality }) => usePreviewVideoTrack(true, { quality }), {
		initialProps: { quality: 'h720' as VideoQuality },
	});

	await waitFor(() => expect(result.current.track).toBe(track));

	rerender({ quality: 'h180' });

	await waitFor(() => expect(track.restartTrack).toHaveBeenCalledWith({ resolution: { width: 320, height: 180 } }));
	expect(mockedCreateLocalVideoTrack).toHaveBeenCalledTimes(1);
	expect(track.stop).not.toHaveBeenCalled();
	expect(result.current.track).toBe(track);

	unmount();
	expect(track.stop).toHaveBeenCalledTimes(1);
});

it('opens the initial preview at the selected resolution without an unnecessary restart', async () => {
	const track = makeTrack();
	mockedCreateLocalVideoTrack.mockResolvedValue(track);

	const { result } = renderHook(() => usePreviewVideoTrack(true, { quality: 'h360' }));

	await waitFor(() => expect(result.current.track).toBe(track));

	expect(mockedCreateLocalVideoTrack).toHaveBeenCalledWith({ resolution: { width: 640, height: 360 } });
	expect(track.restartTrack).not.toHaveBeenCalled();
});
