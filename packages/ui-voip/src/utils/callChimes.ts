/**
 * Tiny synthesized chimes for in-call events. Web Audio API only — no
 * bundled audio assets, no network fetch, no licensing concerns.
 *
 * Each chime is a brief envelope-shaped sine tone (or pair of tones). The
 * envelope is shaped to "plin": fast attack (~5ms), quick exponential
 * release. Volume is intentionally modest (0.18 peak) so the chime
 * doesn't compete with active call audio.
 */

const PEAK_GAIN = 0.18;

const playTone = (frequency: number, startOffset: number, duration: number) => {
	let ctx: AudioContext | null = null;
	try {
		ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
	} catch {
		return;
	}
	if (!ctx) return;

	// Some browsers create the context in 'suspended' state when no user
	// gesture is associated. Inside an active call the user has already
	// granted media access, so resume() is allowed; we ignore failure since
	// the chime is non-critical.
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

	// Close the context shortly after the chime ends so we don't keep an
	// audio node alive for the rest of the call.
	const closeAt = (startOffset + duration + 0.1) * 1000;
	setTimeout(() => {
		void ctx?.close().catch(() => undefined);
	}, closeAt);
};

/**
 * Played for every participant when recording starts. Two ascending notes
 * (E5 → G5) — distinct enough from the join chime to be recognisable, and
 * the rising pattern conventionally signals "started / on".
 */
export const playRecordingChime = (): void => {
	playTone(659.25, 0, 0.16);
	playTone(783.99, 0.13, 0.22);
};

/**
 * Played for every participant when recording stops. The descending mirror
 * of playRecordingChime (G5 → E5) — same notes in reverse so the pair
 * reads unmistakably as "on / off" without users having to learn two
 * unrelated jingles.
 */
export const playRecordingStopChime = (): void => {
	playTone(783.99, 0, 0.16);
	playTone(659.25, 0.13, 0.22);
};

/**
 * Played when a remote participant joins the call (and only while the call
 * is small — gated by the caller). Single brief high note so it lands as
 * a polite "plink" rather than a notification ding.
 */
export const playJoinChime = (): void => {
	playTone(880, 0, 0.09);
};
