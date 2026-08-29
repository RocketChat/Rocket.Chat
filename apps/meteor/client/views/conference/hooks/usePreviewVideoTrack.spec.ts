import { renderHook, waitFor } from '@testing-library/react';
import type { LocalVideoTrack } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';

import type { VideoQuality } from './useCallPreferences';
import { usePreviewVideoTrack } from './usePreviewVideoTrack';

jest.mock('livekit-client', () => ({
	createLocalVideoTrack: jest.fn(),
}));

const mockedCreateLocalVideoTrack = jest.mocked(createLocalVideoTrack);

const makeTrack = () =>
	({
		stop: jest.fn(),
		restartTrack: jest.fn().mockResolvedValue(undefined),
		getProcessor: jest.fn(),
	}) as unknown as LocalVideoTrack;

beforeEach(() => {
	mockedCreateLocalVideoTrack.mockReset();
});

it('restarts the attached preview track instead of replacing it when resolution changes', async () => {
	const track = makeTrack();
	mockedCreateLocalVideoTrack.mockResolvedValue(track);

	const { result, rerender, unmount } = renderHook(({ quality }) => usePreviewVideoTrack(true, { quality, blurLevel: 'none' }), {
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

	const { result } = renderHook(() => usePreviewVideoTrack(true, { quality: 'h360', blurLevel: 'none' }));

	await waitFor(() => expect(result.current.track).toBe(track));

	expect(mockedCreateLocalVideoTrack).toHaveBeenCalledWith({ resolution: { width: 640, height: 360 } });
	expect(track.restartTrack).not.toHaveBeenCalled();
});
