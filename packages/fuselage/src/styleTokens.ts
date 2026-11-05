import tokenBorder from '@rocket.chat/fuselage-tokens/dist/border.json';
import tokenSpacing from '@rocket.chat/fuselage-tokens/dist/spacing.json';
import tokenTypography from '@rocket.chat/fuselage-tokens/dist/typography.json';
import { memoize } from '@rocket.chat/memo';
import invariant from 'invariant';

import {
	isStatusBackgroundColor,
	isStatusColor,
	isStrokeColor,
	isSurfaceColor,
	isTextIconColor,
	neutral,
	statusBackgroundColors,
	strokeColors,
	surfaceColors,
	textIconColors,
	statusColors,
	throwErrorOnInvalidToken,
	isBadgeColor,
	badgeBackgroundColors,
} from './Theme';
import type { BadgeBackgroundColors, StatusBackgroundColors, StatusColors, StrokeColor, SurfaceColors, TextIconColors } from './Theme';
import { getPaletteColor } from './getPaletteColor';
import { toCSSColorValue, toCSSFontValue, toCSSValue } from './helpers/toCSSValue';

export type BorderWidth = keyof typeof tokenBorder.width;
export type BorderRadius = keyof typeof tokenBorder.radius;
export type SpacingToken = keyof typeof tokenSpacing;

export const spacingScale: Readonly<Record<SpacingToken, number>> = tokenSpacing;

const isSpacingToken = (value: string): value is SpacingToken => Object.hasOwn(tokenSpacing, value);

const measure = (computeSpecialValue?: (value: string) => null | undefined | string) =>
	memoize((value) => {
		if (typeof value === 'number') {
			return `${value}px`;
		}

		if (typeof value !== 'string') {
			return undefined;
		}

		const xRegExp = /^(neg-|-)?x(\d+)$/;
		const matches = xRegExp.exec(value);
		if (matches) {
			const [, negativeMark, measureInPixelsAsString] = matches;
			const measureInPixels = (negativeMark ? -1 : 1) * parseInt(measureInPixelsAsString, 10);
			return `${measureInPixels / 16}rem`;
		}

		if (computeSpecialValue) {
			return computeSpecialValue(value) || value;
		}

		return value;
	});

export const borderWidth = (value: BorderWidth) => `${tokenBorder.width[value]}px`;

export const borderRadius = (value: BorderRadius) => `${tokenBorder.radius[value] / 16}rem`;

/** Resolves a border width that is only known at runtime, such as a `Box` prop, to its token, if it names one. */
export const resolveBorderWidth = (value: unknown) =>
	typeof value === 'string' && value in tokenBorder.width ? borderWidth(value as BorderWidth) : undefined;

/** Resolves a border radius that is only known at runtime, such as a `Box` prop, to its token, if it names one. */
export const resolveBorderRadius = (value: unknown) =>
	typeof value === 'string' && value in tokenBorder.radius ? borderRadius(value as BorderRadius) : undefined;

const mapTypeToPrefix = {
	neutral: 'n',
	blue: 'b',
	green: 'g',
	yellow: 'y',
	red: 'r',
	orange: 'o',
	purple: 'p',
} as const;

const isPaletteColorType = (type: unknown): type is keyof typeof mapTypeToPrefix => typeof type === 'string' && type in mapTypeToPrefix;

const isPaletteColorGrade = (grade: unknown): grade is 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 =>
	typeof grade === 'number' && grade % 100 === 0 && grade / 100 >= 1 && grade / 100 <= 9;

const isPaletteColorAlpha = (alpha: unknown): alpha is number | undefined =>
	alpha === undefined || (typeof alpha === 'number' && alpha >= 0 && alpha <= 1);

const paletteColorRegex = /^(neutral|blue|green|yellow|red|orange|purple)-(\d+)(-(\d+))?$/;

/** Resolves a stroke color that is only known at runtime, such as a `Box` prop; anything else falls back to `color`. */
export const resolveStrokeColor = memoize((value) => {
	const colorName = `stroke-${value}`;
	if (isStrokeColor(colorName)) {
		return strokeColors[colorName].toString();
	}
	return color(value);
});

/** Resolves a background color that is only known at runtime, such as a `Box` prop; anything else falls back to `color`. */
export const resolveBackgroundColor = memoize((value) => {
	const colorName = `surface-${value}`;

	if (isSurfaceColor(value)) {
		return surfaceColors[value].toString();
	}

	if (isSurfaceColor(colorName)) {
		return surfaceColors[colorName].toString();
	}

	if (isStatusBackgroundColor(value)) {
		return statusBackgroundColors[value].toString();
	}

	if (isStatusColor(value)) {
		if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
			console.warn(`${value} shouldn't be used as a backgroundColor.`);
		}
		return statusColors[value].toString();
	}

	if (isBadgeColor(value)) {
		return badgeBackgroundColors[value].toString();
	}

	return color(value);
});

/** Resolves a text color that is only known at runtime, such as a `Box` prop; anything else falls back to `color`. */
export const resolveFontColor = memoize((value) => {
	const colorName = `font-${value}`;
	if (isTextIconColor(colorName)) {
		return textIconColors[colorName].toString();
	}
	if (isStatusColor(value)) {
		return statusColors[value].toString();
	}
	return color(value);
});

type Unprefixed<TName extends string, TPrefix extends string> = TName extends `${TPrefix}-${infer TRest}` ? TRest : never;

export const strokeColor = (value: Unprefixed<StrokeColor, 'stroke'>) => strokeColors[`stroke-${value}`].toString();

export const backgroundColor = (
	value: SurfaceColors | Unprefixed<SurfaceColors, 'surface'> | StatusBackgroundColors | BadgeBackgroundColors,
) => resolveBackgroundColor(value) as string;

export const fontColor = (value: Unprefixed<TextIconColors, 'font'> | StatusColors) => resolveFontColor(value) as string;

/** @deprecated **/
export const color = memoize((value) => {
	if (typeof value !== 'string') {
		return;
	}
	if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
		console.warn(`invalid color: ${value}`, new Error().stack);
	}
	if (throwErrorOnInvalidToken) {
		throw new Error(`The color token "${value}" is deprecated. Please use the new color tokens instead.`);
	}

	if (isSurfaceColor(value)) {
		return surfaceColors[value].toString();
	}

	if (isStatusBackgroundColor(value)) {
		return statusBackgroundColors[value].toString();
	}

	if (isStrokeColor(value)) {
		return strokeColors[value].toString();
	}
	if (isTextIconColor(value)) {
		return textIconColors[value].toString();
	}

	if (value === 'surface' || value === 'surface-light') {
		return surfaceColors['surface-light'].toString();
	}

	if (value === 'surface-tint') {
		return toCSSColorValue(value, neutral[100]);
	}

	if (value === 'secondary-info') {
		return toCSSColorValue(value, neutral[700]);
	}

	if (value === 'surface-neutral') {
		return toCSSColorValue(value, neutral[400]);
	}

	const paletteMatches = paletteColorRegex.exec(String(value));
	if (typeof paletteMatches?.length === 'number' && paletteMatches?.length >= 5) {
		const [, type, gradeString, , alphaString] = paletteMatches;
		const grade = parseInt(gradeString, 10);
		const alpha = alphaString !== undefined ? parseInt(alphaString, 10) / 100 : undefined;

		invariant(isPaletteColorType(type), 'invalid color type');
		invariant(isPaletteColorGrade(grade), 'invalid color grade');
		invariant(isPaletteColorAlpha(alpha), 'invalid color alpha');

		const [customProperty, color] = getPaletteColor(type, grade, alpha);

		if (customProperty) {
			return toCSSValue(customProperty, color);
		}

		return color;
	}
	return value;
});

export const size = measure((value: unknown) => {
	if (value === 'none') {
		return '0px';
	}

	if (value === 'full') {
		return '100%';
	}

	if (value === 'sw') {
		return '100vw';
	}

	if (value === 'sh') {
		return '100vh';
	}

	return undefined;
});

export const spacing = memoize((value: unknown) => {
	if (typeof value === 'number') {
		return `${value}px`;
	}

	if (typeof value !== 'string') {
		return undefined;
	}

	if (value === 'none') {
		return '0px';
	}

	const [, negativeMark, step] = /^(neg-|-)?x(\d+)$/.exec(value) ?? [];
	if (!step) {
		return value;
	}

	const token = `x${step}`;
	const pixels = isSpacingToken(token) ? tokenSpacing[token] : Number(step);
	return `${(negativeMark ? -1 : 1) * pixels}px`;
});

/** @internal */
export const inset = measure((value: unknown) => {
	if (value === 'none') {
		return '0px';
	}

	return undefined;
});

type FontFamily = keyof typeof tokenTypography.fontFamily;

const isFontFamily = (value: unknown): value is FontFamily => typeof value === 'string' && value in tokenTypography.fontFamily;

export const fontFamily = memoize((value: FontFamily): string => {
	const fontFamily = tokenTypography.fontFamily[value].map((fontFace) => (fontFace.includes(' ') ? `'${fontFace}'` : fontFace)).join(', ');

	return toCSSFontValue(value, fontFamily);
});

/** Resolves a font family that is only known at runtime, such as a `Box` prop, to its token, if it names one. */
export const resolveFontFamily = (value: unknown) => (isFontFamily(value) ? fontFamily(value) : undefined);

export type FontScaleName = keyof typeof tokenTypography.fontScale;

const isFontScale = (value: unknown): value is FontScaleName => typeof value === 'string' && value in tokenTypography.fontScale;

export const fontScale = memoize((value: FontScaleName) => {
	const { fontSize, fontWeight, lineHeight, letterSpacing } = tokenTypography.fontScale[value];

	return {
		fontSize: `${fontSize / 16}rem`,
		fontWeight,
		lineHeight: `${lineHeight / 16}rem`,
		letterSpacing: `${letterSpacing / 16}rem`,
	};
});

/** Resolves a font scale that is only known at runtime, such as a `Box` prop, to its token, if it names one. */
export const resolveFontScale = (value: unknown) => (isFontScale(value) ? fontScale(value) : undefined);
