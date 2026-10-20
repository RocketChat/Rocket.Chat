import type { cssFn } from '@rocket.chat/css-in-js';
import type { ElementType } from 'react';

import { useArrayLikeClassNameProp } from './useArrayLikeClassNameProp';
import { applyBoxOnlyProps } from './useBoxOnlyProps';
import { useStylingProps } from '../components/Box/useStylingProps';
import { prependClassName } from '../helpers/prependClassName';
import { size, spacing } from '../styleTokens';
import { measureTokenSteps } from '../tamagui.config';
import { renderAs } from '../helpers/renderAs';
import type { Falsy } from '../types/Falsy';

/** `Box` styling props whose values Tamagui resolves itself, through the `space`, `size` and `radius` tokens or as plain CSS. */
const tokenStyleProps = [
	...['margin', 'padding'].flatMap((p) => ['', 'Block', 'BlockStart', 'BlockEnd', 'Inline', 'InlineStart', 'InlineEnd'].map((s) => `${p}${s}`)),
	...['', 'Block', 'BlockStart', 'BlockEnd', 'Inline', 'InlineStart', 'InlineEnd'].map((s) => `inset${s}`),
	'gap',
	'rowGap',
	'columnGap',
	'width',
	'minWidth',
	'maxWidth',
	'height',
	'minHeight',
	'maxHeight',
	'display',
	'flexGrow',
	'flexShrink',
	'flexBasis',
	'flexDirection',
	'flexWrap',
	'alignItems',
	'alignSelf',
	'justifyContent',
	'overflow',
	'position',
];

const sizeProps = new Set(['width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight']);

/** Resolves an `x<n>` measure that has no token, which Tamagui would otherwise hand to CSS as is. */
const toTamaguiValue = (name: string, value: unknown) => {
	const match = typeof value === 'string' ? /^(?:neg-|-)?x(\d+)$/.exec(value) : null;
	if (!match || measureTokenSteps.has(Number(match[1]))) {
		return value;
	}
	return sizeProps.has(name) ? size(value) : spacing(value);
};

/** Moves the styling props Tamagui resolves out of `props`, so they reach the frame instead of becoming css-in-js. */
const takeTokenStyleProps = (props: Record<string, unknown>) => {
	const taken: Record<string, unknown> = {};
	for (const name of tokenStyleProps) {
		// `none` means `0px` to `Box`, which Tamagui can't express as a token
		if (name in props && props[name] !== 'none') {
			taken[name] = toTamaguiValue(name, props[name]);
			delete props[name];
		}
	}
	return taken;
};

/**
 * Turns `Box`-style props into props for a Tamagui frame: styling props become a css-in-js class name, which
 * stays unlayered and so keeps overriding the frame, `rcx-*` and the other `Box`-only props become class names, and `is` becomes `render`.
 */
export const useTamaguiBoxProps = <
	TProps extends {
		className?: string | cssFn | (string | cssFn | Falsy)[];
		is?: ElementType;
	},
>(
	props: TProps,
	className?: string,
) => {
	const boxProps = applyBoxOnlyProps(useArrayLikeClassNameProp(props));
	const tamaguiStyle = takeTokenStyleProps(boxProps as Record<string, unknown>);
	const { is, ...rest } = useStylingProps(boxProps);
	Object.assign(rest, tamaguiStyle);

	if (className) {
		rest.className = prependClassName(rest.className, className);
	}

	if (!is) {
		return rest;
	}

	return {
		...rest,
		render: typeof is === 'string' ? is : renderAs(is),
	};
};
