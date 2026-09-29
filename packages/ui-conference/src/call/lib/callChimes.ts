/** Short synthesized chimes for in-call events, quiet enough not to compete with the call's audio. */

const PEAK_GAIN = 0.18;

let sharedContext: AudioContext | undefined;

/** One context for every chime: browsers cap how many can be open at once, and a busy call chimes in bursts. */
const getContext = (): AudioContext | undefined => {
	if (!sharedContext) {
		const AC: typeof AudioContext | undefined =
			window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AC) return undefined;
		try {
			sharedContext = new AC();
		} catch {
			return undefined;
		}
	}
	// Created 'suspended' without a user gesture in some browsers; a chime that cannot play is not worth failing over.
	if (sharedContext.state === 'suspended') void sharedContext.resume().catch(() => undefined);
	return sharedContext;
};

const playTone = (frequency: number, startOffset: number, duration: number) => {
	const ctx = getContext();
	if (!ctx) return;

	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = 'sine';
	osc.frequency.value = frequency;
	osc.connect(gain);
	gain.connect(ctx.destination);

	const start = ctx.currentTime + startOffset;
	const end = start + duration;
	gain.gain.setValueAtTime(0, start);
	gain.gain.linearRampToValueAtTime(PEAK_GAIN, start + 0.005);
	// exponentialRampToValueAtTime can't target 0; aim very low instead.
	gain.gain.exponentialRampToValueAtTime(0.0001, end);

	osc.start(start);
	osc.stop(end + 0.02);
	osc.onended = () => gain.disconnect();
};

/** Someone joined: a single brief high note, a polite plink rather than a notification ding. */
export const playJoinChime = (): void => {
	playTone(880, 0, 0.09);
};

/** The reader is talking while muted: two short identical tones that say "blocked" without startling. */
export const playMutedReminder = (): void => {
	playTone(440, 0, 0.06);
	playTone(440, 0.1, 0.06);
};
