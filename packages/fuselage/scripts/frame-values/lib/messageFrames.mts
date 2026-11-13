import { literal, type Value } from './literal.mts';
import { borderRadius, borderWidth, strokeColor } from '../../../src/styleTokens.ts';

export const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

/** The ring a message part draws around itself for the keyboard focus, which takes no room: an outline and a halo. */
export const focusRing = () => {
	const thin = borderWidth('default');
	const halo = `calc(${thin} + ${borderWidth('medium')})`;

	return {
		borderRadius: { 'focus-visible': borderRadius('medium') },
		outlineWidth: { 'focus-visible': thin },
		outlineStyle: { 'focus-visible': 'solid' },
		outlineColor: { 'focus-visible': strokeColor('highlight') },
		boxShadow: { 'focus-visible': `0 0 0 ${halo} ${strokeColor('extra-light-highlight')}` },
	};
};

/**
 * The CSS that hides `target` until the message row is hovered or holds keyboard focus. It sets `opacity` and `pointer-events`
 * for the one part, because no frame value expresses touch (`hover: none` and the row's focus within) next to a group key.
 */
export const messageReveal = (target: string) => `${target} {
	pointer-events: none;

	opacity: 0;
}

.rcx-message:hover ${target},
.rcx-message:focus-visible ${target} {
	pointer-events: auto;

	opacity: 1;
}

/* A rule of its own: a browser that does not know :has drops it and keeps the two above */
.rcx-message:has(:focus-visible) ${target} {
	pointer-events: auto;

	opacity: 1;
}`;

export const truncating = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

/**
 * A text part with only what Tamagui's `Text` needs restated: it is inline and pre-wrapped, so the frame gives back the
 * wrapping of its row. Unlike `textFrame`, it leaves out the View defaults a `Text` never had and the font the part inherits.
 */
export const leanText = (style: Record<string, Value>): Record<string, Value> => ({ whiteSpace: 'inherit', wordWrap: 'inherit', ...style });
