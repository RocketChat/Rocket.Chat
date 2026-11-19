import { NO_PINS, SCREENS_DISMISSED, pinScreen, pinsForShares, togglePersonPin, unpinPerson } from './callPins';
import type { ScreenShare } from './screenShares';

const share = (id: string): ScreenShare => ({ id, stream: { id } as MediaStream, name: id, isLocal: false });

describe('togglePersonPin', () => {
	it('pins a person, and unpins them when toggled again', () => {
		const pinned = togglePersonPin(NO_PINS, 'ada');
		expect(pinned.pin).toEqual({ kind: 'person', id: 'ada' });
		expect(togglePersonPin(pinned, 'ada').pin).toBeNull();
	});

	it('replaces a pinned screen', () => {
		expect(togglePersonPin(pinScreen('bob'), 'ada').pin).toEqual({ kind: 'person', id: 'ada' });
	});

	it('leaves an unpinned stage unpinned', () => {
		expect(togglePersonPin(SCREENS_DISMISSED, 'ada').screensDismissed).toBe(true);
	});
});

describe('pinScreen', () => {
	// Whoever was pinned is replaced even while away: they don't take the stage back when they return.
	it('replaces a pinned person', () => {
		expect(pinScreen('bob')).toEqual({ pin: { kind: 'screen', id: 'bob' }, screensDismissed: false });
	});
});

describe('unpinPerson', () => {
	it('only unpins the person named', () => {
		const pinned = togglePersonPin(NO_PINS, 'ada');
		expect(unpinPerson(pinned, 'ada').pin).toBeNull();
		expect(unpinPerson(pinned, 'bob')).toBe(pinned);
		expect(unpinPerson(pinScreen('ada'), 'ada').pin).toEqual({ kind: 'screen', id: 'ada' });
	});
});

describe('pinsForShares', () => {
	const shares = [share('ada'), share('bob')];

	// The reader's choice holds whatever starts after it.
	it('keeps a pinned share while it lasts, and drops it after', () => {
		expect(pinsForShares(pinScreen('ada'), shares).pin).toEqual({ kind: 'screen', id: 'ada' });
		expect(pinsForShares(pinScreen('carol'), shares).pin).toBeNull();
	});

	it('keeps a pinned person whatever is shared', () => {
		expect(pinsForShares(togglePersonPin(NO_PINS, 'carol'), []).pin).toEqual({ kind: 'person', id: 'carol' });
	});

	it('keeps the stage free of shares while any is live, and not after', () => {
		expect(pinsForShares(SCREENS_DISMISSED, shares).screensDismissed).toBe(true);
		expect(pinsForShares(SCREENS_DISMISSED, []).screensDismissed).toBe(false);
	});
});
