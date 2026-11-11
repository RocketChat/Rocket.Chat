import type { CSSProperties } from 'react';

type OptionsCustomProperties = {
	'--rcx-options-width'?: string;
	'--rcx-options-max-height'?: string;
};

/** A number is a length in pixels; a string is any CSS size. */
export type OptionsSize = number | string;

const toCSSSize = (size: OptionsSize) => (typeof size === 'number' ? `${size}px` : size);

/**
 * The inline custom properties a list is sized through, because the size is only known at runtime.
 */
export const optionsCustomProperties = (
	{ width, maxHeight }: { width?: OptionsSize; maxHeight?: OptionsSize },
	style?: CSSProperties,
): CSSProperties & OptionsCustomProperties => ({
	...style,
	...(width !== undefined && { '--rcx-options-width': toCSSSize(width) }),
	...(maxHeight !== undefined && { '--rcx-options-max-height': toCSSSize(maxHeight) }),
});
