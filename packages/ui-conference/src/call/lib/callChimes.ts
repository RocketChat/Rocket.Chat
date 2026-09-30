/** Short synthesized chimes for in-call events, quiet enough not to compete with the call's audio. */

const PEAK_GAIN = 0.18;

const playTone = (frequency: number, startOffset: number, duration: number) => {
	let ctx: AudioContext | null = null;
	try {
		const AC: typeof AudioContext | undefined =
			window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AC) return;
		ctx = new AC();
	} catch {
		return;
	}
	if (!ctx) return;

	// Created 'suspended' without a user gesture in some browsers; a chime that cannot play is not worth failing over.
	if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);

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

	const closeAt = (startOffset + duration + 0.1) * 1000;
	setTimeout(() => {
		void ctx?.close().catch(() => undefined);
	}, closeAt);
};

/** Someone joined: a single brief high note, a polite plink rather than a notification ding. */
export const playJoinChime = (): void => {
	playTone(880, 0, 0.09);
};

/** Someone raised their hand: two rising notes, which read as a question and stay distinct from the join chime by ear. */
export const playHandRaiseChime = (): void => {
	playTone(660, 0, 0.08);
	playTone(990, 0.09, 0.11);
};

/** The reader is talking while muted: two short identical tones that say "blocked" without startling. */
export const playMutedReminder = (): void => {
	playTone(440, 0, 0.06);
	playTone(440, 0.1, 0.06);
};
