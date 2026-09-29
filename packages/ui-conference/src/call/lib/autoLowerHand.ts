/** Above this microphone level the reader counts as speaking. */
export const AUTO_LOWER_SPEAKING_THRESHOLD = 0.12;

/** Pauses between words shorter than this keep the countdown running. */
const SPEAKING_GAP_TOLERANCE_MS = 800;

/** How long someone speaks with their hand up before it drops: they have the floor. */
export const AUTO_LOWER_AFTER_MS = 3000;

export type AutoLowerInput = {
	handRaised: boolean;
	level: number;
	now: number;
	/** Whether the countdown to lowering the hand is already running. */
	counting: boolean;
	/** When the reader was last heard speaking during the countdown; 0 for not since the hand went up. */
	lastSpeakingAt: number;
};

export type AutoLowerDecision = {
	countdown: 'start' | 'cancel' | 'keep';
	lastSpeakingAt: number;
};

/**
 * What one microphone sample does to the countdown that lowers a raised hand: speaking starts it, a pause longer
 * than a gap between words cancels it, and lowering the hand ends it.
 */
export const decideAutoLower = ({ handRaised, level, now, counting, lastSpeakingAt }: AutoLowerInput): AutoLowerDecision => {
	if (!handRaised) {
		return { countdown: counting ? 'cancel' : 'keep', lastSpeakingAt: 0 };
	}
	if (level > AUTO_LOWER_SPEAKING_THRESHOLD) {
		return { countdown: counting ? 'keep' : 'start', lastSpeakingAt: now };
	}
	if (counting && lastSpeakingAt > 0 && now - lastSpeakingAt > SPEAKING_GAP_TOLERANCE_MS) {
		return { countdown: 'cancel', lastSpeakingAt: 0 };
	}
	return { countdown: 'keep', lastSpeakingAt };
};
