// Hues rather than theme colours: they only tell people apart, over a blurred photo that has no theme.
const BACKDROP_TINTS = ['#5f141480', '#1a3a5f80', '#145f2a80', '#5f4a1480', '#3a145f80'];

/** A tint for the blurred avatar behind someone without a camera, the same for the same name every time. */
export const backdropTint = (name: string): string => {
	let h = 0;
	for (let i = 0; i < name.length; i++) {
		h = (h * 31 + name.charCodeAt(i)) | 0;
	}
	return BACKDROP_TINTS[Math.abs(h) % BACKDROP_TINTS.length];
};
