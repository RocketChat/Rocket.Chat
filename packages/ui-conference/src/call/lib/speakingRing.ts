/**
 * Above this audio level the ring shows, so background noise does not keep it lit. Tuned for the sublinear curve
 * `useAudioLevel` applies, which lifts quiet signals.
 */
export const SPEAKING_THRESHOLD = 0.2;

/** The faintest the ring is ever drawn, so speech just over the threshold is still clearly visible. */
const MIN_VISIBLE_RING = 0.55;

/** How strongly the ring shows for an audio level: nothing below the threshold, at least clearly visible above it. */
export const speakingRingLevel = (audioLevel: number): number =>
	audioLevel > SPEAKING_THRESHOLD
		? MIN_VISIBLE_RING + (1 - MIN_VISIBLE_RING) * Math.min(1, (audioLevel - SPEAKING_THRESHOLD) / (1 - SPEAKING_THRESHOLD))
		: 0;

/** The ring's width in pixels; thinner on a thumbnail. */
export const speakingRingThickness = (ringLevel: number, compact: boolean): number => Math.round(ringLevel * (compact ? 3 : 4));

const BACKDROP_TINTS = ['#5f141480', '#1a3a5f80', '#145f2a80', '#5f4a1480', '#3a145f80'];

/** A tint for the blurred avatar behind someone without a camera, the same for the same name every time. */
export const backdropTint = (name: string): string => {
	let h = 0;
	for (let i = 0; i < name.length; i++) {
		h = (h * 31 + name.charCodeAt(i)) | 0;
	}
	return BACKDROP_TINTS[Math.abs(h) % BACKDROP_TINTS.length];
};
