import { renderHook, act } from '@testing-library/react';

import { useReloadOnError } from './useReloadOnError';
import { FakeResponse } from '../../../../../../../tests/mocks/utils/FakeResponse';

interface ITestMediaElement extends HTMLAudioElement {
	_emit: (type: string) => void;
}

function makeMediaEl(): ITestMediaElement {
	const el = document.createElement('audio') as ITestMediaElement;
	(el as any).play = jest.fn().mockResolvedValue(undefined);
	Object.defineProperty(el, 'paused', { value: false, configurable: true });
	el._emit = (type: string) => el.dispatchEvent(new Event(type));
	return el;
}

describe('useReloadOnError', () => {
	const OLD_FETCH = global.fetch;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.spyOn(console, 'debug').mockImplementation(() => null);
		jest.spyOn(console, 'warn').mockImplementation(() => null);
		jest.spyOn(console, 'error').mockImplementation(() => null);

		// default mock: fresh redirect URL + ISO expiry 60s ahead
		global.fetch = jest.fn().mockResolvedValue(
			new FakeResponse(
				JSON.stringify({
					redirectUrl: '/sampleurl?token=xyz',
					expires: new Date(Date.now() + 60_000).toISOString(),
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } },
			),
		) as any;
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
		global.fetch = OLD_FETCH as any;
		jest.restoreAllMocks();
		jest.resetAllMocks();
	});

	it('refreshes media src on error and preserves playback position', async () => {
		const original = '/sampleurl?token=abc';
		const { result } = renderHook(() => useReloadOnError(original, 'audio'));

		const media = makeMediaEl();
		media.currentTime = 12;

		act(() => {
			result.current.mediaRef(media);
		});

		const loadSpy = jest.spyOn(media, 'load');

		await act(async () => {
			media._emit('error');
		});

		expect(global.fetch).toHaveBeenCalledTimes(1);

		expect(media.src).toContain('/sampleurl?token=xyz');

		await act(async () => {
			media._emit('loadedmetadata');
			media._emit('canplay');
		});

		expect(loadSpy).toHaveBeenCalled();
		expect(media.currentTime).toBe(12);
		expect((media as any).play).toHaveBeenCalled();
	});

	it('refreshes media src on stalled and preserves playback position', async () => {
		const original = '/sampleurl?token=abc';
		const { result } = renderHook(() => useReloadOnError(original, 'audio'));

		const media = makeMediaEl();
		media.currentTime = 12;

		act(() => {
			result.current.mediaRef(media);
		});

		const loadSpy = jest.spyOn(media, 'load');

		await act(async () => {
			media._emit('stalled');
		});

		expect(global.fetch).toHaveBeenCalledTimes(1);

		expect(media.src).toContain('/sampleurl?token=xyz');

		await act(async () => {
			media._emit('loadedmetadata');
			media._emit('canplay');
		});

		expect(loadSpy).toHaveBeenCalled();
		expect(media.currentTime).toBe(12);
		expect((media as any).play).toHaveBeenCalled();
	});

	it('does nothing when URL is not expired (second event before expiry)', async () => {
		// Pin system time so Date.now() is deterministic under fake timers
		const fixed = new Date('2030-01-01T00:00:00.000Z');
		jest.setSystemTime(fixed);

		// Backend replies with expiry 60s in the future (relative to pinned time)
		global.fetch = jest.fn().mockResolvedValue(
			new FakeResponse(
				JSON.stringify({
					redirectUrl: '/new?x=1',
					expires: new Date(fixed.getTime() + 60_000).toISOString(),
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } },
			),
		) as any;

		const { result } = renderHook(() => useReloadOnError('/sampleurl?token=abc', 'audio'));
		const media = makeMediaEl();

		act(() => {
			result.current.mediaRef(media);
		});

		// First event → fetch + set expires
		await act(async () => {
			media._emit('stalled');
		});
		expect(global.fetch).toHaveBeenCalledTimes(1);

		// Second event before expiry → early return, no new fetch
		await act(async () => {
			media._emit('stalled');
		});
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it('recovers on stalled after expiry and restores seek position', async () => {
		// Pin time
		const fixed = new Date('2030-01-01T00:00:00.000Z');
		jest.setSystemTime(fixed);

		// 1st fetch (first recovery) -> expires in 5s
		const firstReply = new FakeResponse(
			JSON.stringify({
				redirectUrl: '/fresh?token=first',
				expires: new Date(fixed.getTime() + 5_000).toISOString(),
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } },
		);

		// 2nd fetch (after expiry) -> new url, further expiry
		const secondReply = new FakeResponse(
			JSON.stringify({
				redirectUrl: '/fresh?token=second',
				expires: new Date(fixed.getTime() + 65_000).toISOString(),
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } },
		);

		// Mock fetch to return first, then second
		(global.fetch as unknown as jest.Mock) = jest.fn().mockResolvedValueOnce(firstReply).mockResolvedValueOnce(secondReply);

		const { result } = renderHook(() => useReloadOnError('/sampleurl?token=old', 'audio'));
		const media = makeMediaEl();
		act(() => {
			result.current.mediaRef(media);
		});

		// Initial recovery to set expiresAt (simulate an error)
		await act(async () => {
			media._emit('error');
		});
		expect(global.fetch).toHaveBeenCalledTimes(1);
		expect(media.src).toContain('/fresh?token=first');

		// Complete the ready cycle
		await act(async () => {
			media._emit('loadedmetadata');
			media._emit('canplay');
		});

		// Fast-forward time beyond expiry
		jest.setSystemTime(new Date(fixed.getTime() + 6_000));

		// User scrubs to a new position just before stall is detected
		media.currentTime = 42;

		const loadSpy = jest.spyOn(media, 'load');

		// Now we stall after expiry -> should trigger a new fetch
		await act(async () => {
			media._emit('stalled');
		});

		expect(global.fetch).toHaveBeenCalledTimes(2);
		expect(media.src).toContain('/fresh?token=second');

		// Complete the ready cycle
		await act(async () => {
			media._emit('loadedmetadata');
			media._emit('canplay');
		});

		// Ensure we reloaded and restored the seek position + playback
		expect(loadSpy).toHaveBeenCalled();
		expect(media.currentTime).toBe(42);
		expect((media as any).play).toHaveBeenCalled();
	});

	it('ignores initial play when expiry is unknown', async () => {
		// no fetch expected on first play because expiresAt is not known yet
		global.fetch = jest.fn() as unknown as typeof globalThis.fetch;

		const { result } = renderHook(() => useReloadOnError('/foo', 'audio'));
		const media = makeMediaEl();

		act(() => {
			result.current.mediaRef(media);
		});

		await act(async () => {
			media._emit('play');
		});

		expect(global.fetch).not.toHaveBeenCalled();
	});
});
