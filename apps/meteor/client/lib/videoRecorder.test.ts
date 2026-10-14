import { afterEach, beforeEach, describe, it } from 'node:test';

import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';
import sinon from 'sinon';

import { VideoRecorder } from './videoRecorder';
import { createDeferredPromise } from '../../tests/mocks/utils/createDeferredMockFn';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
let clock: sinon.SinonFakeTimers;

describe('VideoRecorder', () => {
	let mockStream: MediaStream;
	let mockVideoTrack: MediaStreamTrack;
	let mockAudioTrack: MediaStreamTrack;
	let mockVideoElement: HTMLVideoElement;
	let getUserMediaMock: Mock<FunctionLike>;

	const createMockStream = (videoTrack?: MediaStreamTrack, audioTrack?: MediaStreamTrack): MediaStream => {
		return {
			getVideoTracks: fn<FunctionLike>(() => [videoTrack || ({ stop: fn<FunctionLike>() } as unknown as MediaStreamTrack)]),
			getAudioTracks: fn<FunctionLike>(() => [audioTrack || ({ stop: fn<FunctionLike>() } as unknown as MediaStreamTrack)]),
		} as unknown as MediaStream;
	};

	beforeEach(() => {
		clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });

		mockVideoTrack = {
			stop: fn<FunctionLike>(),
		} as unknown as MediaStreamTrack;

		mockAudioTrack = {
			stop: fn<FunctionLike>(),
		} as unknown as MediaStreamTrack;

		mockStream = createMockStream(mockVideoTrack, mockAudioTrack);

		mockVideoElement = document.createElement('video');
		mockVideoElement.load = fn<FunctionLike>();
		mockVideoElement.play = fn<FunctionLike>().mockResolvedValue(undefined);
		mockVideoElement.pause = fn<FunctionLike>();

		getUserMediaMock = fn<FunctionLike>();

		Object.defineProperty(global.navigator, 'mediaDevices', {
			writable: true,
			value: {
				getUserMedia: getUserMediaMock,
			},
		});

		global.MediaRecorder = {
			isTypeSupported: fn<FunctionLike>((type: string) => type === 'video/webm'),
		} as any;
	});

	afterEach(() => {
		mocker.clearAllMocks();
		clock?.restore();
	});

	describe('Asynchronous start and stop handling', () => {
		it('should stop camera tracks when stop is called before getUserMedia resolves', async () => {
			const streamDeferred = createDeferredPromise<MediaStream>();

			getUserMediaMock.mockReturnValue(streamDeferred.promise);

			const callback = fn<FunctionLike>();
			VideoRecorder.start(mockVideoElement, callback);
			VideoRecorder.stop();

			streamDeferred.resolve(mockStream);
			await clock.runAllAsync();

			expect(mockVideoTrack.stop).toHaveBeenCalled();
			expect(mockAudioTrack.stop).toHaveBeenCalled();
			expect(callback).not.toHaveBeenCalledWith(true);
		});

		it('should not initialize camera when stopped early', async () => {
			const streamDeferred = createDeferredPromise<MediaStream>();

			getUserMediaMock.mockReturnValue(streamDeferred.promise);

			VideoRecorder.start(mockVideoElement, fn<FunctionLike>());
			VideoRecorder.stop();

			streamDeferred.resolve(mockStream);
			await clock.runAllAsync();

			expect(VideoRecorder.cameraStarted).toBe(false);
		});

		it('should handle multiple start/stop cycles', async () => {
			const stream1 = createMockStream();
			const stream2 = createMockStream(mockVideoTrack, mockAudioTrack);

			getUserMediaMock.mockReturnValueOnce(Promise.resolve(stream1));

			VideoRecorder.start(mockVideoElement, fn<FunctionLike>());
			VideoRecorder.stop();

			const stream2Deferred = createDeferredPromise<MediaStream>();
			getUserMediaMock.mockReturnValueOnce(stream2Deferred.promise);

			const cb = fn<FunctionLike>();
			VideoRecorder.start(mockVideoElement, cb);

			stream2Deferred.resolve(stream2);
			await clock.runAllAsync();

			expect(cb).toHaveBeenCalledWith(true);
			expect(VideoRecorder.cameraStarted).toBe(true);
		});

		it('should invalidate pending callbacks from previous start when new start is called', async () => {
			const firstStream = createMockStream();
			const secondStream = createMockStream(mockVideoTrack, mockAudioTrack);

			const firstDeferred = createDeferredPromise<MediaStream>();
			const secondDeferred = createDeferredPromise<MediaStream>();

			getUserMediaMock.mockReturnValueOnce(firstDeferred.promise).mockReturnValueOnce(secondDeferred.promise);

			const cb1 = fn<FunctionLike>();
			const cb2 = fn<FunctionLike>();

			VideoRecorder.start(mockVideoElement, cb1);
			VideoRecorder.start(mockVideoElement, cb2);

			secondDeferred.resolve(secondStream);
			await clock.runAllAsync();
			firstDeferred.resolve(firstStream);
			await clock.runAllAsync();

			expect(firstStream.getVideoTracks).toHaveBeenCalled();
			expect(firstStream.getAudioTracks).toHaveBeenCalled();
			expect(cb2).toHaveBeenCalledWith(true);
			expect(cb1).not.toHaveBeenCalledWith(true);
		});
	});

	describe('Normal operation', () => {
		it('should initialize camera', async () => {
			getUserMediaMock.mockResolvedValue(mockStream);

			const cb = fn<FunctionLike>();
			VideoRecorder.start(mockVideoElement, cb);

			await clock.runAllAsync();

			expect(cb).toHaveBeenCalledWith(true);
			expect(VideoRecorder.cameraStarted).toBe(true);
		});

		it('should stop camera tracks', () => {
			(VideoRecorder as any).stream = mockStream;
			(VideoRecorder as any).started = true;
			(VideoRecorder as any)._cameraStarted = true;

			VideoRecorder.stop();

			expect(mockVideoTrack.stop).toHaveBeenCalled();
			expect(mockAudioTrack.stop).toHaveBeenCalled();
			expect(VideoRecorder.cameraStarted).toBe(false);
		});

		it('should return supported mime types', () => {
			expect(VideoRecorder.getSupportedMimeTypes()).toBe('video/webm; codecs=vp8,opus');
		});

		it('should handle permission errors', async () => {
			getUserMediaMock.mockRejectedValue(new Error('Permission denied'));

			const cb = fn<FunctionLike>();
			VideoRecorder.start(mockVideoElement, cb);

			await clock.runAllAsync();

			expect(cb).toHaveBeenCalledWith(false);
		});
	});
});
