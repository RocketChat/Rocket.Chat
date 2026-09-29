import { renderHook, waitFor } from '@testing-library/react';
import type { LocalVideoTrack } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';

import { usePreviewVideoTrack } from './usePreviewVideoTrack';

jest.mock('livekit-client', () => ({
	createLocalVideoTrack: jest.fn(),
}));

const mockedCreateLocalVideoTrack = jest.mocked(createLocalVideoTrack);

const makeTrack = () => ({ stop: jest.fn() }) as unknown as LocalVideoTrack;

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
