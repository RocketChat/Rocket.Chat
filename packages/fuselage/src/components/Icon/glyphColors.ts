import { statusColors, textIconColors } from '../../Theme';

type FontColor<T> = T extends `font-${infer Color}` ? Color : never;

/** A semantic text or status font token. */
export type IconColor = FontColor<keyof typeof textIconColors> | keyof typeof statusColors;

export const glyphColors = Object.fromEntries([
	...Object.entries(textIconColors).flatMap(([name, value]) =>
		name.startsWith('font-') ? [[name.slice(5), { color: String(value) }]] : [],
	),
	...Object.entries(statusColors).map(([name, value]) => [name, { color: String(value) }]),
]) as Record<IconColor, { color: string }>;
