import type { cssFn } from '@rocket.chat/css-in-js';
import { css } from '@rocket.chat/css-in-js';
import type { CSSProperties } from 'react';

import type { Var } from '../../Theme';
import { Palette } from '../../Theme';
import { fromCamelToKebab } from '../../helpers/fromCamelToKebab';
import type { BorderRadius, BorderWidth } from '../../styleTokens';
import {
	borderRadius,
	borderWidth,
	backgroundColor,
	fontColor,
	fontFamily,
	fontScale,
	inset,
	spacing,
	size,
	strokeColor,
} from '../../styleTokens';

export type FontScale = 'hero' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'p1' | 'p1m' | 'p1b' | 'p2' | 'p2m' | 'p2b' | 'c1' | 'c2' | 'micro';

export type StylingProps = {
	border: CSSProperties['border'];
	borderBlock: CSSProperties['borderBlock'];
	borderBlockStart: CSSProperties['borderBlockStart'];
	borderBlockEnd: CSSProperties['borderBlockEnd'];
	borderInline: CSSProperties['borderInline'];
	borderInlineStart: CSSProperties['borderInlineStart'];
	borderInlineEnd: CSSProperties['borderInlineEnd'];
	borderWidth: BorderWidth;
	borderBlockWidth: BorderWidth;
	borderBlockStartWidth: BorderWidth;
	borderBlockEndWidth: BorderWidth;
	borderInlineWidth: BorderWidth;
	borderInlineStartWidth: BorderWidth;
	borderInlineEndWidth: BorderWidth;
	borderStyle: CSSProperties['borderStyle'];
	borderBlockStyle: CSSProperties['borderBlockStyle'];
	borderBlockStartStyle: CSSProperties['borderBlockStartStyle'];
	borderBlockEndStyle: CSSProperties['borderBlockEndStyle'];
	borderInlineStyle: CSSProperties['borderInlineStyle'];
	borderInlineStartStyle: CSSProperties['borderInlineStartStyle'];
	borderInlineEndStyle: CSSProperties['borderInlineEndStyle'];
	borderColor: CSSProperties['borderColor'];
	borderBlockColor: CSSProperties['borderBlockColor'];
	borderBlockStartColor: CSSProperties['borderBlockStartColor'];
	borderBlockEndColor: CSSProperties['borderBlockEndColor'];
	borderInlineColor: CSSProperties['borderInlineColor'];
	borderInlineStartColor: CSSProperties['borderInlineStartColor'];
	borderInlineEndColor: CSSProperties['borderInlineEndColor'];
	borderRadius: BorderRadius;
	borderStartStartRadius: BorderRadius;
	borderStartEndRadius: BorderRadius;
	borderEndStartRadius: BorderRadius;
	borderEndEndRadius: BorderRadius;

	color: CSSProperties['color'] | Var;
	backgroundColor: CSSProperties['backgroundColor'] | Var;
	opacity: CSSProperties['opacity'];

	alignItems: CSSProperties['alignItems'];
	alignContent: CSSProperties['alignContent'];
	justifyItems: CSSProperties['justifyItems'];
	justifyContent: CSSProperties['justifyContent'];
	flexWrap: CSSProperties['flexWrap'];
	flexDirection: CSSProperties['flexDirection'];
	flexGrow: CSSProperties['flexGrow'];
	flexShrink: CSSProperties['flexShrink'];
	flexBasis: CSSProperties['flexBasis'];
	justifySelf: CSSProperties['justifySelf'];
	alignSelf: CSSProperties['alignSelf'];
	order: CSSProperties['order'];
	gap: CSSProperties['gap'];
	rowGap: CSSProperties['rowGap'];
	columnGap: CSSProperties['columnGap'];

	width: CSSProperties['width'];
	minWidth: CSSProperties['minWidth'];
	maxWidth: CSSProperties['maxWidth'];
	height: CSSProperties['height'];
	minHeight: CSSProperties['minHeight'];
	maxHeight: CSSProperties['maxHeight'];
	display: CSSProperties['display'];
	verticalAlign: CSSProperties['verticalAlign'];
	overflow: CSSProperties['overflow'];
	overflowX: CSSProperties['overflowX'];
	overflowY: CSSProperties['overflowY'];
	objectFit: CSSProperties['objectFit'];

	position: CSSProperties['position'];
	zIndex: CSSProperties['zIndex'];
	inset: CSSProperties['inset'];
	insetBlock: CSSProperties['insetBlock'];
	insetBlockStart: CSSProperties['insetBlockStart'];
	insetBlockEnd: CSSProperties['insetBlockEnd'];
	insetInline: CSSProperties['insetInline'];
	insetInlineStart: CSSProperties['insetInlineStart'];
	insetInlineEnd: CSSProperties['insetInlineEnd'];

	margin: CSSProperties['margin'];
	marginBlock: CSSProperties['marginBlock'];
	marginBlockStart: CSSProperties['marginBlockStart'];
	marginBlockEnd: CSSProperties['marginBlockEnd'];
	marginInline: CSSProperties['marginInline'];
	marginInlineStart: CSSProperties['marginInlineStart'];
	marginInlineEnd: CSSProperties['marginInlineEnd'];
	padding: CSSProperties['padding'];
	paddingBlock: CSSProperties['paddingBlock'];
	paddingBlockStart: CSSProperties['paddingBlockStart'];
	paddingBlockEnd: CSSProperties['paddingBlockEnd'];
	paddingInline: CSSProperties['paddingInline'];
	paddingInlineStart: CSSProperties['paddingInlineStart'];
	paddingInlineEnd: CSSProperties['paddingInlineEnd'];

	fontFamily: CSSProperties['fontFamily'] | FontScale;
	fontSize: CSSProperties['fontSize'] | FontScale;
	fontStyle: CSSProperties['fontStyle'];
	fontWeight: CSSProperties['fontWeight'] | FontScale;
	letterSpacing: CSSProperties['letterSpacing'] | FontScale;
	lineHeight: CSSProperties['lineHeight'] | FontScale;
	textAlign: CSSProperties['textAlign'];
	textTransform: CSSProperties['textTransform'];
	textDecorationLine: CSSProperties['textDecorationLine'];
	wordBreak: CSSProperties['wordBreak'];

	elevation: '0' | '1' | '2' | '1nb' | '2nb';
	invisible: boolean;
	withTruncatedText: boolean;
	size: CSSProperties['blockSize'];
	minSize: CSSProperties['blockSize'];
	maxSize: CSSProperties['blockSize'];
	fontScale: FontScale;
};

type PropDefinition =
	| {
			toCSSValue: (value: unknown) => string | undefined;
	  }
	| {
			toStyle: (value: unknown) => cssFn | undefined;
	  };

const stringProp: PropDefinition = {
	toCSSValue: (value) => (typeof value === 'string' ? value : undefined),
};

const numberOrStringProp: PropDefinition = {
	toCSSValue: (value) => {
		if (typeof value === 'number' || typeof value === 'string') {
			return String(value);
		}

		return undefined;
	},
};

const borderWidthProp: PropDefinition = {
	toCSSValue: borderWidth,
};

const borderRadiusProp: PropDefinition = {
	toCSSValue: borderRadius,
};

const backgroundColorProp: PropDefinition = {
	toCSSValue: backgroundColor,
};

const fontColorProp: PropDefinition = {
	toCSSValue: fontColor,
};

const strokeColorProp: PropDefinition = {
	toCSSValue: strokeColor,
};

const sizeProp: PropDefinition = {
	toCSSValue: size,
};

const insetProp: PropDefinition = {
	toCSSValue: inset,
};

const marginProp: PropDefinition = {
	toCSSValue: spacing,
};

const paddingProp: PropDefinition = {
	toCSSValue: spacing,
};

const gapProp: PropDefinition = {
	toCSSValue: spacing,
};

const fontFamilyProp: PropDefinition = {
	toCSSValue: fontFamily,
};

const fontSizeProp: PropDefinition = {
	toCSSValue: (value) => fontScale(value)?.fontSize || size(value),
};

const fontWeightProp: PropDefinition = {
	toCSSValue: (value) => (value ? String(fontScale(value)?.fontWeight || value) : undefined),
};

const lineHeightProp: PropDefinition = {
	toCSSValue: (value) => fontScale(value)?.lineHeight || size(value),
};

const letterSpacingProp: PropDefinition = {
	toCSSValue: (value) => (value ? String(fontScale(value)?.letterSpacing || value) : undefined),
};

export const propDefs: Record<keyof StylingProps, PropDefinition> = {
	border: stringProp,
	borderBlock: stringProp,
	borderBlockStart: stringProp,
	borderBlockEnd: stringProp,
	borderInline: stringProp,
	borderInlineStart: stringProp,
	borderInlineEnd: stringProp,
	borderWidth: borderWidthProp,
	borderBlockWidth: borderWidthProp,
	borderBlockStartWidth: borderWidthProp,
	borderBlockEndWidth: borderWidthProp,
	borderInlineWidth: borderWidthProp,
	borderInlineStartWidth: borderWidthProp,
	borderInlineEndWidth: borderWidthProp,
	borderStyle: stringProp,
	borderBlockStyle: stringProp,
	borderBlockStartStyle: stringProp,
	borderBlockEndStyle: stringProp,
	borderInlineStyle: stringProp,
	borderInlineStartStyle: stringProp,
	borderInlineEndStyle: stringProp,
	borderColor: strokeColorProp,
	borderBlockColor: strokeColorProp,
	borderBlockStartColor: strokeColorProp,
	borderBlockEndColor: strokeColorProp,
	borderInlineColor: strokeColorProp,
	borderInlineStartColor: strokeColorProp,
	borderInlineEndColor: strokeColorProp,
	borderRadius: borderRadiusProp,
	borderStartStartRadius: borderRadiusProp,
	borderStartEndRadius: borderRadiusProp,
	borderEndStartRadius: borderRadiusProp,
	borderEndEndRadius: borderRadiusProp,

	color: fontColorProp,
	backgroundColor: backgroundColorProp,
	opacity: numberOrStringProp,

	alignItems: stringProp,
	alignContent: stringProp,
	justifyItems: stringProp,
	justifyContent: stringProp,
	flexWrap: stringProp,
	flexDirection: stringProp,
	flexGrow: numberOrStringProp,
	flexShrink: numberOrStringProp,
	flexBasis: stringProp,
	justifySelf: stringProp,
	alignSelf: stringProp,
	order: numberOrStringProp,
	gap: gapProp,
	rowGap: gapProp,
	columnGap: gapProp,

	width: sizeProp,
	minWidth: sizeProp,
	maxWidth: sizeProp,
	height: sizeProp,
	minHeight: sizeProp,
	maxHeight: sizeProp,
	display: stringProp,
	verticalAlign: stringProp,
	overflow: stringProp,
	overflowX: stringProp,
	overflowY: stringProp,
	objectFit: stringProp,

	position: stringProp,
	zIndex: numberOrStringProp,
	inset: insetProp,
	insetBlock: insetProp,
	insetBlockStart: insetProp,
	insetBlockEnd: insetProp,
	insetInline: insetProp,
	insetInlineStart: insetProp,
	insetInlineEnd: insetProp,

	margin: marginProp,
	marginBlock: marginProp,
	marginBlockStart: marginProp,
	marginBlockEnd: marginProp,
	marginInline: marginProp,
	marginInlineStart: marginProp,
	marginInlineEnd: marginProp,
	padding: paddingProp,
	paddingBlock: paddingProp,
	paddingBlockStart: paddingProp,
	paddingBlockEnd: paddingProp,
	paddingInline: paddingProp,
	paddingInlineStart: paddingProp,
	paddingInlineEnd: paddingProp,

	fontFamily: fontFamilyProp,
	fontSize: fontSizeProp,
	fontStyle: stringProp,
	fontWeight: fontWeightProp,
	letterSpacing: letterSpacingProp,
	lineHeight: lineHeightProp,
	textAlign: stringProp,
	textTransform: stringProp,
	textDecorationLine: stringProp,
	wordBreak: stringProp,

	elevation: {
		toStyle: (value) => {
			if (value === '0') {
				return css`
					box-shadow: none;
				`;
			}

			if (value === '1') {
				return css`
					box-shadow: 0px 0px 12px 0px ${Palette.shadow['shadow-elevation-1']};
					border: 1px solid ${Palette.shadow['shadow-elevation-border']};
				`;
			}

			if (value === '1nb') {
				return css`
					box-shadow: 0px 0px 12px 0px ${Palette.shadow['shadow-elevation-1']};
				`;
			}

			if (value === '2') {
				return css`
					box-shadow:
						0px 0px 2px 0px ${Palette.shadow['shadow-elevation-2x']},
						0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y']};
					border: 1px solid ${Palette.shadow['shadow-elevation-border']};
				`;
			}

			if (value === '2nb') {
				return css`
					box-shadow:
						0px 0px 2px 0px ${Palette.shadow['shadow-elevation-2x']},
						0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y']};
				`;
			}

			return undefined;
		},
	},
	invisible: {
		toStyle: (value) =>
			value
				? css`
						visibility: hidden;
						opacity: 0;
					`
				: undefined,
	},
	withTruncatedText: {
		toStyle: (value) =>
			value
				? css`
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					`
				: undefined,
	},
	size: {
		toStyle: (value) =>
			size(value)
				? css`
						width: ${size(value)} !important;
						height: ${size(value)} !important;
					`
				: undefined,
	},
	minSize: {
		toStyle: (value) =>
			size(value)
				? css`
						min-width: ${size(value)} !important;
						min-height: ${size(value)} !important;
					`
				: undefined,
	},
	maxSize: {
		toStyle: (value) =>
			size(value)
				? css`
						max-width: ${size(value)} !important;
						max-height: ${size(value)} !important;
					`
				: undefined,
	},
	fontScale: {
		toStyle: (value) => css`
			font-size: ${fontScale(value)?.fontSize} !important;
			font-weight: ${fontScale(value)?.fontWeight} !important;
			letter-spacing: ${fontScale(value)?.letterSpacing} !important;
			line-height: ${fontScale(value)?.lineHeight} !important;
		`,
	},
};

const compiledPropDefs = new Map(
	(Object.entries(propDefs) as [keyof StylingProps, PropDefinition][]).map(
		([propName, propDef]): [propName: string, inject: (value: unknown, stylingProps: Map<keyof StylingProps, cssFn>) => void] => {
			if ('toCSSValue' in propDef) {
				const cssProperty = fromCamelToKebab(propName);
				const { toCSSValue } = propDef;
				return [
					propName,
					(value, stylingProps) => {
						const cssValue = toCSSValue(value);

						if (cssValue === undefined) {
							return;
						}

						stylingProps.set(
							propName,
							css`
								${cssProperty}: ${cssValue} !important;
							`,
						);
					},
				];
			}

			const { toStyle } = propDef;

			return [
				propName,
				(value, stylingProps) => {
					const style = toStyle(value);

					if (style === undefined) {
						return;
					}

					stylingProps.set(propName, style);
				},
			];
		},
	),
);

export const extractStylingProps = <TProps extends Record<string, unknown>>(
	props: TProps & Partial<StylingProps>,
): [props: TProps, styles: cssFn | undefined] => {
	const stylingProps = new Map<keyof StylingProps, cssFn>();
	const newProps: Record<string, unknown> = {};

	for (const [propName, value] of Object.entries(props)) {
		const inject = compiledPropDefs.get(propName);

		if (!inject) {
			newProps[propName] = value;
			continue;
		}

		if (value === undefined) {
			continue;
		}

		inject(value, stylingProps);
	}

	const styles = stylingProps.size
		? css`
				${Array.from(stylingProps.values())}
			`
		: undefined;

	return [newProps as TProps, styles];
};
