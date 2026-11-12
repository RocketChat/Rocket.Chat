import { themed } from './frameTokens.mts';

/**
 * The colour of a link in each of its states, under the `--rcx-link-*` custom properties a theme can override.
 * A frame can't express `:visited` and `:active`, so this owns the link's `color` and the frame owns the rest.
 */
export const linkStates = (selector: string, color: string) =>
	[
		`${selector} {\n\tcolor: ${themed('link-color', color)};\n}`,
		`${selector}:focus,\n${selector}:focus-within {\n\tcolor: ${themed('link-focus-color', color)};\n}`,
		`${selector}:where(:visited) {\n\tcolor: ${themed('link-visited-color', color)};\n}`,
		`${selector}:where(:active) {\n\tcolor: ${themed('link-active-color', color)};\n}`,
	].join('\n\n');
