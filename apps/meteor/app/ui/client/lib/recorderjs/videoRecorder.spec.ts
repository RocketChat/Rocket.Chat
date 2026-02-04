import { VideoRecorder } from './videoRecorder';

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

	beforeEach(() => {
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
	});

	describe('Race condition fix', () => {
		it('should stop camera tracks when stop is called before getUserMedia resolves', async () => {
			const streamPromise = new Promise<MediaStream>((resolve) => {
				setTimeout(() => resolve(mockStream), 100);
			});

			getUserMediaMock.mockReturnValue(streamPromise);

			const callback = jest.fn();
			VideoRecorder.start(mockVideoElement, callback);
			VideoRecorder.stop();

			await streamPromise;
			await new Promise((resolve) => setTimeout(resolve, 150));

			expect(mockVideoTrack.stop).toHaveBeenCalled();
			expect(mockAudioTrack.stop).toHaveBeenCalled();
			expect(callback).not.toHaveBeenCalledWith(true);
		});

		it('should not initialize camera when stopped early', async () => {
			const streamPromise = new Promise<MediaStream>((resolve) => {
				setTimeout(() => resolve(mockStream), 100);
			});

			getUserMediaMock.mockReturnValue(streamPromise);

			VideoRecorder.start(mockVideoElement, jest.fn());
			VideoRecorder.stop();

			await streamPromise;
			await new Promise((resolve) => setTimeout(resolve, 150));

			expect(VideoRecorder.cameraStarted.get()).toBe(false);
		});

		it('should handle multiple start/stop cycles', async () => {
			const stream1 = {
				getVideoTracks: jest.fn(() => [{ stop: jest.fn() } as unknown as MediaStreamTrack]),
				getAudioTracks: jest.fn(() => [{ stop: jest.fn() } as unknown as MediaStreamTrack]),
			} as unknown as MediaStream;

			const stream2 = {
				getVideoTracks: jest.fn(() => [mockVideoTrack]),
				getAudioTracks: jest.fn(() => [mockAudioTrack]),
			} as unknown as MediaStream;

			getUserMediaMock.mockReturnValueOnce(Promise.resolve(stream1));

			VideoRecorder.start(mockVideoElement, jest.fn());
			VideoRecorder.stop();

			const promise2 = new Promise<MediaStream>((resolve) => setTimeout(() => resolve(stream2), 50));
			getUserMediaMock.mockReturnValueOnce(promise2);

			const cb = jest.fn();
			VideoRecorder.start(mockVideoElement, cb);

			await promise2;
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(cb).toHaveBeenCalledWith(true);
			expect(VideoRecorder.cameraStarted.get()).toBe(true);
		});

		it('should invalidate pending callbacks from previous start when new start is called', async () => {
			const firstStream = {
				getVideoTracks: jest.fn(() => [{ stop: jest.fn() } as unknown as MediaStreamTrack]),
				getAudioTracks: jest.fn(() => [{ stop: jest.fn() } as unknown as MediaStreamTrack]),
			} as unknown as MediaStream;

			const secondStream = {
				getVideoTracks: jest.fn(() => [mockVideoTrack]),
				getAudioTracks: jest.fn(() => [mockAudioTrack]),
			} as unknown as MediaStream;

			const p1 = new Promise<MediaStream>((resolve) => setTimeout(() => resolve(firstStream), 200));
			const p2 = new Promise<MediaStream>((resolve) => setTimeout(() => resolve(secondStream), 50));

			getUserMediaMock.mockReturnValueOnce(p1).mockReturnValueOnce(p2);

			const cb1 = jest.fn();
			const cb2 = jest.fn();

			VideoRecorder.start(mockVideoElement, cb1);
			VideoRecorder.start(mockVideoElement, cb2);

			await Promise.all([p1, p2]);
			await new Promise((resolve) => setTimeout(resolve, 250));

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

			await new Promise((resolve) => setTimeout(resolve, 50));

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

			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(cb).toHaveBeenCalledWith(false);
		});
	});
});
