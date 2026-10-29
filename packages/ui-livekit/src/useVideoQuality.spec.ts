import type { VideoQuality } from '@rocket.chat/ui-conference';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { LocalVideoTrack, Room } from 'livekit-client';
import { VideoPresets } from 'livekit-client';
import { useState } from 'react';

import { useVideoQuality } from './useVideoQuality';

const persisted = jest.fn();

jest.mock('@rocket.chat/ui-conference', () => ({
	useVideoQualityPreference: () => {
		const [videoQuality, setVideoQuality] = useState<VideoQuality>('h720');
		return {
			videoQuality,
			selectVideoQuality: (quality: VideoQuality) => {
				persisted(quality);
				setVideoQuality(quality);
			},
		};
	},
}));

const makeRoom = () => ({ options: { videoCaptureDefaults: { deviceId: 'brio' } } }) as unknown as Room;

const makeTrack = (restartTrack = jest.fn().mockResolvedValue(undefined)) =>
	({ restartTrack, mediaStreamTrack: { getSettings: () => ({ deviceId: 'brio', height: 720 }) } }) as unknown as LocalVideoTrack;

beforeEach(() => {
	persisted.mockClear();
	jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

it('opens the camera at the remembered quality', () => {
	const room = makeRoom();

	renderHook(() => useVideoQuality(room, undefined));

	expect(room.options.videoCaptureDefaults).toEqual({ deviceId: 'brio', resolution: VideoPresets.h720.resolution });
});

// The camera is off, so there is nothing to restart: the choice waits for it, rather than being dropped.
it('keeps a choice made with the camera off for when it starts', () => {
	const room = makeRoom();
	const { result } = renderHook(() => useVideoQuality(room, undefined));

	act(() => result.current.select('auto'));

	expect(persisted).toHaveBeenCalledWith('auto');
	expect(result.current.quality).toBe('auto');
	expect(room.options.videoCaptureDefaults).toEqual({ deviceId: 'brio' });
});

it('does not remember a resolution the camera refused', async () => {
	const track = makeTrack(jest.fn().mockRejectedValue(new Error('OverconstrainedError')));
	const { result } = renderHook(() => useVideoQuality(makeRoom(), track));

	await act(async () => result.current.select('h1080'));

	expect(track.restartTrack).toHaveBeenCalledWith({ resolution: VideoPresets.h1080.resolution, deviceId: 'brio' });
	expect(persisted).not.toHaveBeenCalled();
	expect(result.current.quality).toBe('h720');
});

// A camera turned off keeps the track, and turning it back on reopens it at what it had before.
it('restarts a camera turned back on at the choice made while it was off', async () => {
	const track = makeTrack();
	const { result, rerender } = renderHook(({ cam }) => useVideoQuality(makeRoom(), cam), {
		initialProps: { cam: track as LocalVideoTrack | undefined },
	});
	expect(track.restartTrack).not.toHaveBeenCalled();

	rerender({ cam: undefined });
	act(() => result.current.select('h180'));
	rerender({ cam: track });

	await waitFor(() => expect(track.restartTrack).toHaveBeenCalledWith({ resolution: VideoPresets.h180.resolution, deviceId: 'brio' }));
});
