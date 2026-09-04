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
 * Played when a remote participant joins the call (and only while the call
 * is small — gated by the caller). Single brief high note so it lands as
 * a polite "plink" rather than a notification ding.
 */
export const playJoinChime = (): void => {
	playTone(880, 0, 0.09);
};

/**
 * Played when someone raises their hand, so a call knows there is a question waiting even when nobody is looking
 * at the screen.
 *
 * Two rising notes rather than the join chime's single plink: it is a request, and a rise reads as one — a
 * question rather than an announcement. It also keeps the two events apart by ear, which matters when both can
 * happen in the same second.
 */
export const playHandRaiseChime = (): void => {
	playTone(660, 0, 0.08);
	playTone(990, 0.09, 0.11);
};

/**
 * Played when the user speaks while muted, so they notice even when not
 * looking at the screen. Two short identical tones — a soft "nu-uh" that
 * says "blocked" without being startling.
 */
export const playMutedReminder = (): void => {
	playTone(440, 0, 0.06);
	playTone(440, 0.1, 0.06);
};
