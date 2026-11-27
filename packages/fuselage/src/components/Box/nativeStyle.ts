import type { StylingProps } from './stylingProps';
import { propDefs } from './stylingProps';
import { resolveFontScale, size } from '../../styleTokens';

type Resolve = (css: string) => string | number | undefined;
type Target = [resolve: Resolve, ...styleKeys: string[]];

const numeric = /^-?\d*\.?\d+$/;

/** Plain numbers are px; `rem` is read at the 16px root, since a native client has no user font size to follow. */
const length: Resolve = (css) => {
	const [, value, unit] = /^(-?\d*\.?\d+)(px|rem)?$/.exec(css) ?? [];
	if (value !== undefined) {
		return Number(value) * (unit === 'rem' ? 16 : 1);
	}
	return /^-?\d*\.?\d+%$/.test(css) || css === 'auto' ? css : undefined;
};

/** A theme colour comes as `var(--token, fallback)`; a native client has no custom properties, so it takes the light fallback. */
const color: Resolve = (css) => {
	let value = css;
	for (let match = /^var\(--[^,]+,\s*(.*)\)$/s.exec(value); match; match = /^var\(--[^,]+,\s*(.*)\)$/s.exec(value)) {
		[, value] = match;
	}
	return value.includes('var(') ? undefined : value;
};

const number: Resolve = (css) => (numeric.test(css) ? Number(css) : undefined);

const oneOf =
	(values: Record<string, string>): Resolve =>
	(css) =>
		values[css];

const keyword = (...names: string[]) => oneOf(Object.fromEntries(names.map((name) => [name, name])));

const alignment = (...extra: string[]) =>
	oneOf({ ...Object.fromEntries(['flex-start', 'flex-end', 'center', ...extra].map((n) => [n, n])), start: 'flex-start', end: 'flex-end' });

const fontWeight: Resolve = (css) => (/^\d+$/.test(css) || css === 'normal' || css === 'bold' ? css : undefined);

const edges = (prefix: string) => ({
	[prefix]: [length, prefix] as Target,
	[`${prefix}Block`]: [length, `${prefix}Vertical`] as Target,
	[`${prefix}BlockStart`]: [length, `${prefix}Top`] as Target,
	[`${prefix}BlockEnd`]: [length, `${prefix}Bottom`] as Target,
	[`${prefix}Inline`]: [length, `${prefix}Horizontal`] as Target,
	[`${prefix}InlineStart`]: [length, `${prefix}Start`] as Target,
	[`${prefix}InlineEnd`]: [length, `${prefix}End`] as Target,
});

const targets: Partial<Record<keyof StylingProps, Target>> = {
	...(edges('margin') as Record<string, Target>),
	...(edges('padding') as Record<string, Target>),

	borderWidth: [length, 'borderWidth'],
	borderBlockWidth: [length, 'borderTopWidth', 'borderBottomWidth'],
	borderBlockStartWidth: [length, 'borderTopWidth'],
	borderBlockEndWidth: [length, 'borderBottomWidth'],
	borderInlineWidth: [length, 'borderStartWidth', 'borderEndWidth'],
	borderInlineStartWidth: [length, 'borderStartWidth'],
	borderInlineEndWidth: [length, 'borderEndWidth'],
	borderStyle: [keyword('solid', 'dotted', 'dashed'), 'borderStyle'],
	borderColor: [color, 'borderColor'],
	borderBlockColor: [color, 'borderTopColor', 'borderBottomColor'],
	borderBlockStartColor: [color, 'borderTopColor'],
	borderBlockEndColor: [color, 'borderBottomColor'],
	borderInlineColor: [color, 'borderStartColor', 'borderEndColor'],
	borderInlineStartColor: [color, 'borderStartColor'],
	borderInlineEndColor: [color, 'borderEndColor'],
	borderRadius: [length, 'borderRadius'],
	borderStartStartRadius: [length, 'borderTopStartRadius'],
	borderStartEndRadius: [length, 'borderTopEndRadius'],
	borderEndStartRadius: [length, 'borderBottomStartRadius'],
	borderEndEndRadius: [length, 'borderBottomEndRadius'],

	color: [color, 'color'],
	backgroundColor: [color, 'backgroundColor'],
	opacity: [number, 'opacity'],

	alignItems: [alignment('stretch', 'baseline'), 'alignItems'],
	alignContent: [alignment('stretch', 'space-between', 'space-around', 'space-evenly'), 'alignContent'],
	justifyContent: [alignment('space-between', 'space-around', 'space-evenly'), 'justifyContent'],
	alignSelf: [alignment('auto', 'stretch', 'baseline'), 'alignSelf'],
	flexWrap: [keyword('nowrap', 'wrap', 'wrap-reverse'), 'flexWrap'],
	flexDirection: [keyword('row', 'row-reverse', 'column', 'column-reverse'), 'flexDirection'],
	flexGrow: [number, 'flexGrow'],
	flexShrink: [number, 'flexShrink'],
	flexBasis: [length, 'flexBasis'],
	gap: [length, 'gap'],
	rowGap: [length, 'rowGap'],
	columnGap: [length, 'columnGap'],

	width: [length, 'width'],
	minWidth: [length, 'minWidth'],
	maxWidth: [length, 'maxWidth'],
	height: [length, 'height'],
	minHeight: [length, 'minHeight'],
	maxHeight: [length, 'maxHeight'],
	display: [keyword('flex', 'none'), 'display'],
	overflow: [keyword('visible', 'hidden', 'scroll'), 'overflow'],
	objectFit: [keyword('cover', 'contain', 'fill', 'scale-down'), 'objectFit'],

	position: [keyword('relative', 'absolute', 'static'), 'position'],
	zIndex: [number, 'zIndex'],
	inset: [length, 'top', 'right', 'bottom', 'left'],
	insetBlock: [length, 'top', 'bottom'],
	insetBlockStart: [length, 'top'],
	insetBlockEnd: [length, 'bottom'],
	insetInline: [length, 'start', 'end'],
	insetInlineStart: [length, 'start'],
	insetInlineEnd: [length, 'end'],

	fontSize: [length, 'fontSize'],
	fontStyle: [keyword('normal', 'italic'), 'fontStyle'],
	fontWeight: [fontWeight, 'fontWeight'],
	letterSpacing: [length, 'letterSpacing'],
	lineHeight: [length, 'lineHeight'],
	textAlign: [keyword('auto', 'left', 'right', 'center', 'justify'), 'textAlign'],
	textTransform: [keyword('none', 'uppercase', 'lowercase', 'capitalize'), 'textTransform'],
	textDecorationLine: [keyword('none', 'underline', 'line-through', 'underline line-through'), 'textDecorationLine'],
};

const assign = (style: Record<string, unknown>, keys: string[], value: unknown) => {
	if (value === undefined) {
		return;
	}
	for (const key of keys) {
		style[key] = value;
	}
};

/** Props the native host takes where the web has a style rule for them. */
type HostProps = { numberOfLines?: number; ellipsizeMode?: 'tail' };

/**
 * Translates the `Box` styling props to a React Native `style` object, resolving the same tokens the web does.
 * A prop with no React Native equivalent, or a value it cannot take, is dropped.
 */
export const extractNativeStyle = <TProps extends Record<string, unknown>>(
	props: TProps & Partial<StylingProps>,
): [props: TProps, style: Record<string, unknown>, hostProps: HostProps] => {
	const rest: Record<string, unknown> = {};
	const style: Record<string, unknown> = {};
	const hostProps: HostProps = {};

	for (const [name, value] of Object.entries(props)) {
		if (!Object.hasOwn(propDefs, name)) {
			rest[name] = value;
			continue;
		}

		if (value === undefined) {
			continue;
		}

		const propName = name as keyof StylingProps;
		const target = targets[propName];
		const propDef = propDefs[propName];

		if (target && 'toCSSValue' in propDef) {
			const [resolve, ...keys] = target;
			const css = propDef.toCSSValue(value);
			assign(style, keys, css === undefined ? undefined : resolve(css));
			continue;
		}

		switch (propName) {
			case 'size':
			case 'minSize':
			case 'maxSize': {
				const css = size(value);
				const prefix = propName === 'size' ? '' : propName.slice(0, 3);
				const [width, height] = prefix ? [`${prefix}Width`, `${prefix}Height`] : ['width', 'height'];
				assign(style, [width, height], css === undefined ? undefined : length(css));
				break;
			}
			case 'fontScale': {
				const scale = resolveFontScale(value);
				if (scale) {
					assign(style, ['fontSize'], length(scale.fontSize));
					assign(style, ['fontWeight'], fontWeight(String(scale.fontWeight)));
					assign(style, ['letterSpacing'], length(scale.letterSpacing));
					assign(style, ['lineHeight'], length(scale.lineHeight));
				}
				break;
			}
			case 'invisible':
				if (value) {
					style.opacity = 0;
				}
				break;
			case 'withTruncatedText':
				if (value) {
					hostProps.numberOfLines = 1;
					hostProps.ellipsizeMode = 'tail';
				}
				break;
			default:
				break;
		}
	}

	return [rest as TProps, style, hostProps];
};
