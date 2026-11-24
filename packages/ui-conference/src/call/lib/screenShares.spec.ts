import type { ScreenShare } from './screenShares.js';
import { collectScreenShares, pickFeaturedScreen, recordShareStarts } from './screenShares.js';

const streamA = { id: 'a' } as MediaStream;
const streamB = { id: 'b' } as MediaStream;
const streamC = { id: 'c' } as MediaStream;

const share = (id: string, stream: MediaStream): ScreenShare => ({ id, stream, name: id, isLocal: false });

describe('collectScreenShares', () => {
	it('lists the reader first, then whoever else is sharing', () => {
		const shares = collectScreenShares({ id: 'me', screenStream: streamA }, [
			{ id: 'ada', displayName: 'Ada', muted: false, held: false, screenStream: streamB },
			{ id: 'bob', displayName: 'Bob', muted: false, held: false },
		]);

		expect(shares).toEqual([
			{ id: 'me', stream: streamA, isLocal: true },
			{ id: 'ada', stream: streamB, name: 'Ada', isLocal: false },
		]);
	});
});

describe('recordShareStarts', () => {
	it('stamps new shares, keeps the stamp of ongoing ones and forgets stopped ones', () => {
		const first = recordShareStarts(new Map(), [share('ada', streamA), share('bob', streamB)], 100);
		const second = recordShareStarts(first, [share('ada', streamA)], 200);
		expect([...second]).toEqual([['ada', { stream: streamA, startedAt: 100 }]]);
	});

	// Stopping and sharing again hands over a new stream: that is a new share, and it takes the stage again.
	it('treats a new stream from the same person as a new share', () => {
		const starts = recordShareStarts(new Map(), [share('ada', streamA)], 100);
		const again = recordShareStarts(starts, [share('ada', streamC)], 300);
		expect(again.get('ada')?.startedAt).toBe(300);
	});
});

describe('pickFeaturedScreen', () => {
	const shares = [share('ada', streamA), share('bob', streamB)];
	const starts = new Map([
		['ada', { stream: streamA, startedAt: 200 }],
		['bob', { stream: streamB, startedAt: 100 }],
	]);

	it('features nothing when nobody shares', () => {
		expect(pickFeaturedScreen([], null, starts)).toBeNull();
	});

	it('features the pinned share, even over one that started later', () => {
		expect(pickFeaturedScreen(shares, 'bob', starts)?.id).toBe('bob');
	});

	it('features the latest share when nothing pinned is still there', () => {
		expect(pickFeaturedScreen(shares, null, starts)?.id).toBe('ada');
		expect(pickFeaturedScreen(shares, 'carol', starts)?.id).toBe('ada');
	});
});
