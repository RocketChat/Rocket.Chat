import { renderHook } from '@testing-library/react';

import { getAudioLevel, subscribeToAudioLevel } from './audioLevelStore';
import { useAudioLevel } from './useAudioLevel';

const close = jest.fn(() => Promise.resolve());
const AudioContextMock = jest.fn(() => ({
	createMediaStreamSource: () => ({ connect: jest.fn(), disconnect: jest.fn() }),
	createAnalyser: () => ({ fftSize: 0, smoothingTimeConstant: 0, getByteTimeDomainData: jest.fn() }),
	close,
}));

beforeAll(() => {
	Object.defineProperty(window, 'AudioContext', { configurable: true, value: AudioContextMock });
});

beforeEach(() => {
	jest.clearAllMocks();
});

afterEach(() => {
	jest.restoreAllMocks();
});

const microphone = () => ({ getAudioTracks: () => [{ kind: 'audio' }] }) as unknown as MediaStream;

// A tile's speaking ring and its voice bars read the same microphone: one analyser has to serve both.
it('measures a stream once however many read it, until the last one leaves', () => {
	const stream = microphone();

	const first = renderHook(() => useAudioLevel(stream));
	const second = renderHook(() => useAudioLevel(stream));

	expect(AudioContextMock).toHaveBeenCalledTimes(1);

	first.unmount();
	expect(close).not.toHaveBeenCalled();

	second.unmount();
	expect(close).toHaveBeenCalledTimes(1);
});

it('reads 0 rather than throwing for something that only looks like a stream', () => {
	AudioContextMock.mockImplementationOnce(() => ({
		createMediaStreamSource: () => {
			throw new TypeError('not a MediaStream');
		},
		createAnalyser: jest.fn(),
		close,
	}));

	const { result } = renderHook(() => useAudioLevel(microphone()));

	expect(result.current).toBe(0);
	expect(close).toHaveBeenCalledTimes(1);
});

// Made before the reader touched the page, the context starts suspended and would read silence forever.
it('resumes a suspended context on the next interaction', () => {
	const resume = jest.fn(() => Promise.resolve());
	AudioContextMock.mockImplementationOnce(() => ({
		createMediaStreamSource: () => ({ connect: jest.fn(), disconnect: jest.fn() }),
		createAnalyser: () => ({ fftSize: 0, smoothingTimeConstant: 0, getByteTimeDomainData: jest.fn() }),
		close,
		state: 'suspended',
		resume,
	}));

	const { unmount } = renderHook(() => useAudioLevel(microphone()));
	resume.mockClear();

	document.dispatchEvent(new Event('pointerdown'));
	expect(resume).toHaveBeenCalledTimes(1);

	unmount();
	document.dispatchEvent(new Event('pointerdown'));
	expect(resume).toHaveBeenCalledTimes(1);
});

it('stops sampling when the last reader leaves while being told of a reading', () => {
	const frames: FrameRequestCallback[] = [];
	const raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
	AudioContextMock.mockImplementationOnce(() => ({
		createMediaStreamSource: () => ({ connect: jest.fn(), disconnect: jest.fn() }),
		createAnalyser: () => ({
			fftSize: 4,
			smoothingTimeConstant: 0,
			getByteTimeDomainData: (buf: Uint8Array) => buf.fill(255),
		}),
		close,
	}));

	const stream = microphone();
	let heard: number | undefined;
	const unsubscribe = subscribeToAudioLevel(stream, () => {
		heard = getAudioLevel(stream);
		unsubscribe();
	});
	frames.shift()?.(1000);

	// A buffer at full scale is as loud as a reading gets.
	expect(heard).toBe(1);
	expect(close).toHaveBeenCalledTimes(1);
	expect(frames).toHaveLength(0);
	expect(raf).toHaveBeenCalled();
});

it('reads 0 and measures nothing for a stream without audio', () => {
	const { result } = renderHook(() => useAudioLevel({ getAudioTracks: () => [] } as unknown as MediaStream));

	expect(result.current).toBe(0);
	expect(AudioContextMock).not.toHaveBeenCalled();
});
