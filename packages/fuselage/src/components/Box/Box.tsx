import type { cssFn } from '@rocket.chat/css-in-js';
import type { AllHTMLAttributes, ElementType, RefAttributes, SVGAttributes } from 'react';
import { createElement, memo } from 'react';

import { useBoxTransform, BoxTransforms } from './BoxTransforms';
import type { StylingProps } from './stylingProps';
import { useStylingProps } from './useStylingProps';
import { useArrayLikeClassNameProp } from '../../hooks/useArrayLikeClassNameProp';
import { useBoxOnlyProps } from '../../hooks/useBoxOnlyProps';
import type { Falsy } from '../../types/Falsy';

export type BoxProps = Partial<StylingProps> &
	Omit<AllHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation' | keyof StylingProps> &
	Omit<SVGAttributes<SVGElement>, keyof AllHTMLAttributes<HTMLElement> | 'elevation' | keyof StylingProps> &
	RefAttributes<any> & {
		/**
		 * The `is` prop is used to render the Box as a different HTML tag. It can also be used to render a different fuselage component.
		 */
		is?: ElementType;
		className?: string | cssFn | (string | cssFn | Falsy)[];
		animated?: boolean;
		withRichContent?: boolean | 'inlineWithoutBreaks';
		htmlSize?: AllHTMLAttributes<HTMLElement>['size'];
		focusable?: boolean;
	};

function Box({ is = 'div', ...props }: BoxProps) {
	let propsWithStringClassName = useArrayLikeClassNameProp(props);

	const transformFn = useBoxTransform();
	if (transformFn) {
		propsWithStringClassName = transformFn(propsWithStringClassName);
	}

	const propsWithoutStylingProps = useStylingProps(propsWithStringClassName);
	const propsWithoutBoxOnlyProps = useBoxOnlyProps(propsWithoutStylingProps);

	const element = createElement(is, propsWithoutBoxOnlyProps);

	if (transformFn) {
		return <BoxTransforms.Provider value={null}>{element}</BoxTransforms.Provider>;
	}

	return element;
}

export default memo(Box);
