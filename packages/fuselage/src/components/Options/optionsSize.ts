/** A number is a length in pixels; a string is any CSS size. */
export type OptionsSize = number | string;

/** The CSS length of a size, for the `--rcx-options-*` custom property it is passed through. */
export const toCSSSize = (size: OptionsSize) => (typeof size === 'number' ? `${size}px` : size);
