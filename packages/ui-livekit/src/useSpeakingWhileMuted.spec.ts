import { act, renderHook } from '@testing-library/react';

import { useSpeakingWhileMuted } from './useSpeakingWhileMuted';

/**
 * The detector listens to a muted microphone and answers "this person is talking". What it is asked about is a
 * waveform, so the interesting behaviour is all timing: how long speech has to last before it says yes, and how
 * long a pause has to last before it takes that back. The second one is what these cover — a notice driven by an
 * answer that dropped on the first quiet sample blinked word by word.
 */

/** Loud enough that `level` clears the threshold, and silence, in the shape `getByteTimeDomainData` fills. */
const LOUD = 136;
const SILENT = 128;

let sample = SILENT;

const stopTrack = jest.fn();
const resume = jest.fn(() => Promise.resolve());

beforeEach(() => {
	jest.useFakeTimers();
	sample = SILENT;
	stopTrack.mockClear();
	resume.mockClear();

	Object.defineProperty(navigator, 'mediaDevices', {
		configurable: true,
		value: { getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) },
	});

	(window as unknown as { AudioContext: unknown }).AudioContext = class {
		state = 'suspended';

		resume = resume;

		createMediaStreamSource() {
			return { connect: () => undefined };
		}

		createAnalyser() {
			return {
				fftSize: 512,
				smoothingTimeConstant: 0,
				connect: () => undefined,
				getByteTimeDomainData: (buf: Uint8Array) => buf.fill(sample),
			};
		}

		close() {
			return Promise.resolve();
		}
	};
});

afterEach(() => {
	jest.useRealTimers();
	jest.restoreAllMocks();
});

/** Lets the hook's `getUserMedia` settle, since nothing is sampled until it has. */
const start = async (onFirstSpeech?: () => void) => {
	const view = renderHook(() => useSpeakingWhileMuted(true, onFirstSpeech));
	await act(async () => undefined);
	return view;
};

const listenFor = async (ms: number) => {
	await act(async () => {
		jest.advanceTimersByTime(ms);
	});
};

describe('useSpeakingWhileMuted', () => {
	it('says nothing until the speech has lasted', async () => {
		const { result } = await start();

		sample = LOUD;
		await listenFor(300);
		// Not yet: 300ms of noise is a door closing, not someone talking.
		expect(result.current).toBe(false);

		await listenFor(300);
		expect(result.current).toBe(true);
	});

	// The reminder chime: once per mute, not once per sentence.
	it('tells about the speech once while muted', async () => {
		const onFirstSpeech = jest.fn();
		await start(onFirstSpeech);

		sample = LOUD;
		await listenFor(600);
		sample = SILENT;
		await listenFor(3100);
		sample = LOUD;
		await listenFor(600);

		expect(onFirstSpeech).toHaveBeenCalledTimes(1);
	});

	// The regression this guards: speech dips below any threshold between words, and an answer that fell with it
	// made the muted-while-talking notice flicker rather than sit there and be read.
	it('holds through a pause between words', async () => {
		const { result } = await start();

		sample = LOUD;
		await listenFor(600);
		expect(result.current).toBe(true);

		sample = SILENT;
		await listenFor(500);
		// Still talking, as far as anyone watching is concerned.
		expect(result.current).toBe(true);

		sample = LOUD;
		await listenFor(600);
		expect(result.current).toBe(true);
	});

	it('takes it back once the quiet lasts', async () => {
		const { result } = await start();

		sample = LOUD;
		await listenFor(600);
		expect(result.current).toBe(true);

		sample = SILENT;
		await listenFor(3100);
		expect(result.current).toBe(false);
	});

	// Unmuting answers the question the notice was asking, so there is nothing left to say — and the microphone
	// this opened is handed back rather than held for a call that no longer needs it.
	it('stops listening the moment the microphone is live again', async () => {
		const { result, rerender } = renderHook(({ muted }) => useSpeakingWhileMuted(muted), { initialProps: { muted: true } });
		await act(async () => undefined);

		sample = LOUD;
		await listenFor(600);
		expect(result.current).toBe(true);

		rerender({ muted: false });
		expect(result.current).toBe(false);
		expect(stopTrack).toHaveBeenCalled();
	});

	// The call's microphone, not the browser's default: the notice is about the device the reader is talking into.
	it('listens to the microphone the call has open', async () => {
		renderHook(() => useSpeakingWhileMuted(true, undefined, 'headset'));
		await act(async () => undefined);

		expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: { deviceId: { exact: 'headset' } } });
	});

	it('resumes a context the browser started suspended', async () => {
		await start();

		expect(resume).toHaveBeenCalled();
	});

	it('hands the microphone back when there is nothing to measure it with', async () => {
		delete (window as unknown as { AudioContext?: unknown }).AudioContext;

		await start();

		expect(stopTrack).toHaveBeenCalled();
	});
});
