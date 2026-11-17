import type { ScreenShare } from './screenShares';
import { NO_SCREEN_CHOICE, collectScreenShares, nextScreenChoice, pickFeaturedScreen, recordShareStarts } from './screenShares';

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
		expect(first.started).toBe('bob');

		const second = recordShareStarts(first.starts, [share('ada', streamA)], 200);
		expect(second.started).toBeNull();
		expect([...second.starts]).toEqual([['ada', { stream: streamA, startedAt: 100 }]]);
	});

	// Stopping and sharing again hands over a new stream: that is a new share, and it takes the stage again.
	it('treats a new stream from the same person as a new share', () => {
		const { starts } = recordShareStarts(new Map(), [share('ada', streamA)], 100);
		const again = recordShareStarts(starts, [share('ada', streamC)], 300);
		expect(again.started).toBe('ada');
		expect(again.starts.get('ada')?.startedAt).toBe(300);
	});
});

describe('nextScreenChoice', () => {
	const shares = [share('ada', streamA), share('bob', streamB)];

	// The reader's choice holds whatever starts after it.
	it('keeps the choice while the chosen share lasts, and drops it after', () => {
		expect(nextScreenChoice({ chosen: 'ada', dismissed: false }, shares).chosen).toBe('ada');
		expect(nextScreenChoice({ chosen: 'carol', dismissed: false }, shares).chosen).toBeNull();
	});

	it('keeps the stage free of shares while any is live, and not after', () => {
		expect(nextScreenChoice({ chosen: null, dismissed: true }, shares).dismissed).toBe(true);
		expect(nextScreenChoice({ chosen: null, dismissed: true }, []).dismissed).toBe(false);
	});
});

describe('pickFeaturedScreen', () => {
	const shares = [share('ada', streamA), share('bob', streamB)];
	const starts = new Map([
		['ada', { stream: streamA, startedAt: 200 }],
		['bob', { stream: streamB, startedAt: 100 }],
	]);

	it('features nothing when nobody shares', () => {
		expect(pickFeaturedScreen([], NO_SCREEN_CHOICE, starts)).toBeNull();
	});

	it('features the chosen share, even over one that started later', () => {
		expect(pickFeaturedScreen(shares, { chosen: 'bob', dismissed: false }, starts)?.id).toBe('bob');
	});

	it('features the latest share when nothing chosen is still there', () => {
		expect(pickFeaturedScreen(shares, NO_SCREEN_CHOICE, starts)?.id).toBe('ada');
		expect(pickFeaturedScreen(shares, { chosen: 'carol', dismissed: false }, starts)?.id).toBe('ada');
	});

	it('features nothing once the reader unpinned the share on the stage', () => {
		expect(pickFeaturedScreen(shares, { chosen: null, dismissed: true }, starts)).toBeNull();
	});
});
