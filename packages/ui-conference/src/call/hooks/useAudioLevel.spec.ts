import { renderHook } from '@testing-library/react';

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

it('reads 0 and measures nothing for a stream without audio', () => {
	const { result } = renderHook(() => useAudioLevel({ getAudioTracks: () => [] } as unknown as MediaStream));

	expect(result.current).toBe(0);
	expect(AudioContextMock).not.toHaveBeenCalled();
});
