import { collectScreenShares } from './screenShares';

const streamA = { id: 'a' } as MediaStream;
const streamB = { id: 'b' } as MediaStream;

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
