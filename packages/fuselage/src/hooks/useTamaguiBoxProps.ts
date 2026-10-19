import type { cssFn } from '@rocket.chat/css-in-js';
import { createElement, type ElementType } from 'react';

import { useStylingProps } from '../components/Box/useStylingProps';
import { prependClassName } from '../helpers/prependClassName';
import { prependRcxClassNames } from '../helpers/prependRcxClassNames';
import type { Falsy } from '../types/Falsy';
import { useArrayLikeClassNameProp } from './useArrayLikeClassNameProp';

/**
 * Turns `Box`-style props into props for a Tamagui frame: styling props become a css-in-js class name, which
 * stays unlayered and so keeps overriding the frame, `rcx-*` props become class names, and `is` becomes `render`.
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
	const { is, ...rest } = useStylingProps(prependRcxClassNames(useArrayLikeClassNameProp(props)));

	if (className) {
		rest.className = prependClassName(rest.className, className);
	}

	if (!is) {
		return rest;
	}

	return {
		...rest,
		render: typeof is === 'string' ? is : (renderProps: Record<string, unknown>) => createElement(is, renderProps),
	};
};
