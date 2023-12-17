declare module 'emojione' {
	export as namespace emojione;

	export let sprites: boolean;
	export let imagePathSVG: string;
	export let imagePathSVGSprites: string;
	export let imageType: 'png' | 'svg';
	export let unicodeAlt: boolean;
	export let ascii: boolean;
	export let unicodeRegexp: string;
	export let cacheBustParam: string;
	export let emojioneList: {
		[key: string]: {
			uc_base: string;
			uc_output: string;
			uc_match: string;
			uc_greedy: string;
			shortnames: string[];
			category: string;
			emojiPackage: string;
		};
	};

	type Unicode = string;
	type MappedUnicode = Record<Unicode, string>;

	export let regShortNames: RegExp;
	export let shortnames: string;
	export const imageTitleTag: boolean;
	export const defaultPathPNG: string;
	export let imagePathPNG: string;
	export const emojiSize: string;
	export const fileExtension: string;
	export const asciiList: Record<string, Unicode>;
	export const riskyMatchAscii: boolean;
	export const regAsciiRisky: RegExp;
	export const regAscii: RegExp;

	export function toShort(str: string): string;
	export function toImage(str: string): string;
	export function shortnameToImage(str: string): string;
	export function unicodeToImage(str: string): string;
	export function shortnameToUnicode(str: string): string;
	export function shortnameConversionMap(): unknown;
	export function unicodeCharRegex(): unknown;
	export function convert(str: string): string;
	export function mapUnicodeToShort(): MappedUnicode;
	export function escapeHTML(str: string): string;
	export function unescapeHTML(str: string): string;
}
