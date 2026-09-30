import { decideAutoLower } from './autoLowerHand';

const LOUD = 0.5;
const QUIET = 0;

describe('decideAutoLower', () => {
	it('starts the countdown when someone with a raised hand speaks', () => {
		expect(decideAutoLower({ handRaised: true, level: LOUD, now: 1000, counting: false, lastSpeakingAt: 0 })).toEqual({
			countdown: 'start',
			lastSpeakingAt: 1000,
		});
	});

	it('keeps counting while they keep speaking', () => {
		expect(decideAutoLower({ handRaised: true, level: LOUD, now: 1500, counting: true, lastSpeakingAt: 1000 })).toEqual({
			countdown: 'keep',
			lastSpeakingAt: 1500,
		});
	});

	// A pause between words is not the end of what they had to say.
	it('keeps counting through a short pause', () => {
		expect(decideAutoLower({ handRaised: true, level: QUIET, now: 1700, counting: true, lastSpeakingAt: 1000 })).toEqual({
			countdown: 'keep',
			lastSpeakingAt: 1000,
		});
	});

	it('cancels the countdown after a longer silence', () => {
		expect(decideAutoLower({ handRaised: true, level: QUIET, now: 1900, counting: true, lastSpeakingAt: 1000 })).toEqual({
			countdown: 'cancel',
			lastSpeakingAt: 0,
		});
	});

	it('stops counting once the hand is down', () => {
		expect(decideAutoLower({ handRaised: false, level: LOUD, now: 1900, counting: true, lastSpeakingAt: 1000 })).toEqual({
			countdown: 'cancel',
			lastSpeakingAt: 0,
		});
		expect(decideAutoLower({ handRaised: false, level: LOUD, now: 1900, counting: false, lastSpeakingAt: 0 }).countdown).toBe('keep');
	});
});
