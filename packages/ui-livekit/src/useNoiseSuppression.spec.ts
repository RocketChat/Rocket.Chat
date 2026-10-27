import type { NoiseMethod } from '@rocket.chat/ui-conference';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { LocalAudioTrack, Room } from 'livekit-client';
import { useState } from 'react';

import { RnnoiseProcessor } from './rnnoiseProcessor';
import { useNoiseSuppression } from './useNoiseSuppression';

const persisted = jest.fn();
let remembered: NoiseMethod = 'browser';

jest.mock('@rocket.chat/ui-conference', () => ({
	supportsRnnoise: () => true,
	useNoiseSuppressionPreference: () => {
		const [noiseMethod, setNoiseMethod] = useState<NoiseMethod>(remembered);
		return {
			noiseMethod,
			selectNoiseMethod: (method: NoiseMethod) => {
				persisted(method);
				setNoiseMethod(method);
			},
		};
	},
}));

jest.mock('./rnnoiseProcessor', () => ({ RnnoiseProcessor: jest.fn() }));

const makeRoom = () => ({ options: { audioCaptureDefaults: { deviceId: 'yeti' } } }) as unknown as Room;

/** A microphone whose browser filter is `filtering`, and whose processor fails to start when `rnnoiseFails`. */
const makeTrack = ({ filtering = true, rnnoiseFails = false } = {}) => {
	let processor: unknown;
	const track = {
		constraints: { deviceId: { exact: 'yeti' }, echoCancellation: true, noiseSuppression: filtering },
		mediaStreamTrack: { getSettings: () => ({ noiseSuppression: filtering }) },
		restartTrack: jest.fn(async (options: { noiseSuppression: boolean }) => {
			filtering = options.noiseSuppression;
		}),
		getProcessor: () => processor,
		setProcessor: jest.fn(async (next: unknown) => {
			if (rnnoiseFails) {
				throw new Error('suspended');
			}
			processor = next;
		}),
		stopProcessor: jest.fn(async () => {
			processor = undefined;
		}),
	};
	return track as typeof track & LocalAudioTrack;
};

/** Waits out the method a new microphone is opened with, during which a choice is not taken. */
const settled = (result: { current: { pending: boolean } }) => waitFor(() => expect(result.current.pending).toBe(false));

beforeEach(() => {
	jest.clearAllMocks();
	remembered = 'browser';
	jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

it('opens new microphones without the browser filter when RNNoise is remembered', () => {
	remembered = 'rnnoise';
	const room = makeRoom();

	renderHook(() => useNoiseSuppression(room, undefined, '/rnnoise'));

	expect(room.options.audioCaptureDefaults).toEqual({ deviceId: 'yeti', noiseSuppression: false });
});

// Two suppressors in a row eat into the voice.
it('turns the browser filter off, on the same microphone, before RNNoise runs', async () => {
	const track = makeTrack();
	const { result } = renderHook(() => useNoiseSuppression(makeRoom(), track, '/rnnoise'));
	await settled(result);

	await act(async () => result.current.select('rnnoise'));

	expect(track.restartTrack).toHaveBeenCalledWith({ deviceId: { exact: 'yeti' }, echoCancellation: true, noiseSuppression: false });
	expect(RnnoiseProcessor).toHaveBeenCalledWith('/rnnoise');
	expect(track.setProcessor).toHaveBeenCalled();
	expect(result.current.method).toBe('rnnoise');
	expect(persisted).toHaveBeenCalledWith('rnnoise');
});

it('falls back to the browser filter when RNNoise cannot start, and stops offering it', async () => {
	const track = makeTrack({ rnnoiseFails: true });
	const { result } = renderHook(() => useNoiseSuppression(makeRoom(), track, '/rnnoise'));
	await settled(result);

	await act(async () => result.current.select('rnnoise'));

	expect(track.mediaStreamTrack.getSettings().noiseSuppression).toBe(true);
	expect(result.current.method).toBe('browser');
	expect(result.current.methods).toEqual(['none', 'browser']);
	expect(persisted).not.toHaveBeenCalled();
});

// Failing at the start can be the browser holding audio back until a click, which choosing it from the menu is.
it('keeps offering RNNoise when it could not start with the call', async () => {
	remembered = 'rnnoise';
	const track = makeTrack({ rnnoiseFails: true });
	const { result } = renderHook(() => useNoiseSuppression(makeRoom(), track, '/rnnoise'));

	await settled(result);

	expect(result.current.method).toBe('browser');
	expect(result.current.methods).toEqual(['none', 'browser', 'rnnoise']);
});

it('takes RNNoise out when another method is chosen', async () => {
	remembered = 'rnnoise';
	const track = makeTrack({ filtering: false });
	const { result } = renderHook(() => useNoiseSuppression(makeRoom(), track, '/rnnoise'));
	await settled(result);
	expect(result.current.method).toBe('rnnoise');

	await act(async () => result.current.select('none'));

	expect(track.stopProcessor).toHaveBeenCalled();
	expect(track.restartTrack).not.toHaveBeenCalled();
	expect(result.current.method).toBe('none');
});
