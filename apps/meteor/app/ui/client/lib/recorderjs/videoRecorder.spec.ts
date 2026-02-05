import { VideoRecorder } from './videoRecorder';
import { createDeferredPromise } from '../../../../../tests/mocks/utils/createDeferredMockFn';

jest.mock('meteor/reactive-var', () => ({
	ReactiveVar: jest.fn().mockImplementation((initialValue) => {
		let value = initialValue;
		return {
			get: jest.fn(() => value),
			set: jest.fn((newValue) => {
				value = newValue;
			}),
		};
	}),
}));

describe('VideoRecorder', () => {
	let mockStream: MediaStream;
	let mockVideoTrack: MediaStreamTrack;
	let mockAudioTrack: MediaStreamTrack;
	let mockVideoElement: HTMLVideoElement;
	let getUserMediaMock: jest.Mock;

	const createMockStream = (videoTrack?: MediaStreamTrack, audioTrack?: MediaStreamTrack): MediaStream => {
		return {
			getVideoTracks: jest.fn(() => [videoTrack || ({ stop: jest.fn() } as unknown as MediaStreamTrack)]),
			getAudioTracks: jest.fn(() => [audioTrack || ({ stop: jest.fn() } as unknown as MediaStreamTrack)]),
		} as unknown as MediaStream;
	};

	beforeEach(() => {
		jest.useFakeTimers();

		mockVideoTrack = {
			stop: jest.fn(),
		} as unknown as MediaStreamTrack;

		mockAudioTrack = {
			stop: jest.fn(),
		} as unknown as MediaStreamTrack;

		mockStream = {
			getVideoTracks: jest.fn(() => [mockVideoTrack]),
			getAudioTracks: jest.fn(() => [mockAudioTrack]),
		} as unknown as MediaStream;

		mockVideoElement = document.createElement('video');

		getUserMediaMock = jest.fn();

		Object.defineProperty(global.navigator, 'mediaDevices', {
			writable: true,
			value: {
				getUserMedia: getUserMediaMock,
			},
		});

		global.MediaRecorder = {
			isTypeSupported: jest.fn((type: string) => type === 'video/webm'),
		} as any;
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.useRealTimers();
	});

	describe('Asynchronous start and stop handling', () => {
		it('should stop camera tracks when stop is called before getUserMedia resolves', async () => {
			const streamDeferred = createDeferredPromise<MediaStream>();

			getUserMediaMock.mockReturnValue(streamDeferred.promise);

			const callback = jest.fn();
			VideoRecorder.start(mockVideoElement, callback);
			VideoRecorder.stop();

			streamDeferred.resolve(mockStream);
			await Promise.resolve();
			jest.runAllTimers();
			await Promise.resolve();

			expect(mockVideoTrack.stop).toHaveBeenCalled();
			expect(mockAudioTrack.stop).toHaveBeenCalled();
			expect(callback).not.toHaveBeenCalledWith(true);
		});

		it('should not initialize camera when stopped early', async () => {
			const streamDeferred = createDeferredPromise<MediaStream>();

			getUserMediaMock.mockReturnValue(streamDeferred.promise);

			VideoRecorder.start(mockVideoElement, jest.fn());
			VideoRecorder.stop();

			streamDeferred.resolve(mockStream);
			await Promise.resolve();
			jest.runAllTimers();
			await Promise.resolve();

			expect(VideoRecorder.cameraStarted.get()).toBe(false);
		});

		it('should handle multiple start/stop cycles', async () => {
			const stream1 = createMockStream();
			const stream2 = createMockStream(mockVideoTrack, mockAudioTrack);

			getUserMediaMock.mockReturnValueOnce(Promise.resolve(stream1));

			VideoRecorder.start(mockVideoElement, jest.fn());
			VideoRecorder.stop();

			const stream2Deferred = createDeferredPromise<MediaStream>();
			getUserMediaMock.mockReturnValueOnce(stream2Deferred.promise);

			const cb = jest.fn();
			VideoRecorder.start(mockVideoElement, cb);

			stream2Deferred.resolve(stream2);
			await Promise.resolve();
			jest.runAllTimers();
			await Promise.resolve();

			expect(cb).toHaveBeenCalledWith(true);
			expect(VideoRecorder.cameraStarted.get()).toBe(true);
		});

		it('should invalidate pending callbacks from previous start when new start is called', async () => {
			const firstStream = createMockStream();
			const secondStream = createMockStream(mockVideoTrack, mockAudioTrack);

			const firstDeferred = createDeferredPromise<MediaStream>();
			const secondDeferred = createDeferredPromise<MediaStream>();

			getUserMediaMock.mockReturnValueOnce(firstDeferred.promise).mockReturnValueOnce(secondDeferred.promise);

			const cb1 = jest.fn();
			const cb2 = jest.fn();

			VideoRecorder.start(mockVideoElement, cb1);
			VideoRecorder.start(mockVideoElement, cb2);

			secondDeferred.resolve(secondStream);
			await Promise.resolve();
			firstDeferred.resolve(firstStream);
			await Promise.resolve();
			jest.runAllTimers();
			await Promise.resolve();

			expect(firstStream.getVideoTracks).toHaveBeenCalled();
			expect(firstStream.getAudioTracks).toHaveBeenCalled();
			expect(cb2).toHaveBeenCalledWith(true);
			expect(cb1).not.toHaveBeenCalledWith(true);
		});
	});

	describe('Normal operation', () => {
		it('should initialize camera', async () => {
			getUserMediaMock.mockResolvedValue(mockStream);

			const cb = jest.fn();
			VideoRecorder.start(mockVideoElement, cb);

			await Promise.resolve();
			jest.runAllTimers();
			await Promise.resolve();

			expect(cb).toHaveBeenCalledWith(true);
			expect(VideoRecorder.cameraStarted.get()).toBe(true);
		});

		it('should stop camera tracks', () => {
			(VideoRecorder as any).stream = mockStream;
			(VideoRecorder as any).started = true;
			VideoRecorder.cameraStarted.set(true);

			VideoRecorder.stop();

			expect(mockVideoTrack.stop).toHaveBeenCalled();
			expect(mockAudioTrack.stop).toHaveBeenCalled();
			expect(VideoRecorder.cameraStarted.get()).toBe(false);
		});

		it('should return supported mime types', () => {
			expect(VideoRecorder.getSupportedMimeTypes()).toBe('video/webm; codecs=vp8,opus');
		});

		it('should handle permission errors', async () => {
			getUserMediaMock.mockRejectedValue(new Error('Permission denied'));

			const cb = jest.fn();
			VideoRecorder.start(mockVideoElement, cb);

			await Promise.resolve();
			jest.runAllTimers();
			await Promise.resolve();

			expect(cb).toHaveBeenCalledWith(false);
		});
	});
});
