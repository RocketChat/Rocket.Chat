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
		/** Element or component to render, which receives the other props and the class names the styling props become. */
		is?: ElementType;
		/** Class names, and `css` functions from `@rocket.chat/css-in-js`, which become class names. */
		className?: string | cssFn | (string | cssFn | Falsy)[];
		/** Transitions every change of style over 180ms, unless the user prefers reduced motion. */
		animated?: boolean;
		/**
		 * Styles the plain HTML elements inside it as text: emphasis, links, code, lists, headings, paragraphs and
		 * preformatted text, for markup the app doesn't build from components. `inlineWithoutBreaks` leaves out the
		 * headings, paragraphs and preformatted text.
		 */
		withRichContent?: boolean | 'inlineWithoutBreaks';
		/** The HTML `size` attribute, since `size` sets the width and height. */
		htmlSize?: AllHTMLAttributes<HTMLElement>['size'];
		/** Shows the focus ring when the element has keyboard focus; `tabIndex` makes it reachable. */
		focusable?: boolean;
	};

/**
 * The element every Fuselage component and layout container is built from. Its styling props mirror CSS properties and
 * also take design tokens: spacing (`x16`, `neg-x8`), colors (`hint`, `tint`) and font scales (`p2m`). A screen
 * composes named layout containers instead of using it directly.
 */
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
