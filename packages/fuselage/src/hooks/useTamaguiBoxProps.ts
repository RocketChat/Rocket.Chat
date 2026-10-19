import type { cssFn } from '@rocket.chat/css-in-js';
import type { ElementType } from 'react';

import { useArrayLikeClassNameProp } from './useArrayLikeClassNameProp';
import { applyBoxOnlyProps } from './useBoxOnlyProps';
import { useStylingProps } from '../components/Box/useStylingProps';
import { prependClassName } from '../helpers/prependClassName';
import { renderAs } from '../helpers/renderAs';
import type { Falsy } from '../types/Falsy';

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
	const { is, ...rest } = useStylingProps(applyBoxOnlyProps(useArrayLikeClassNameProp(props)));

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
