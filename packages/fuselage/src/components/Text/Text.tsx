import { createElement, type HTMLAttributes, type LabelHTMLAttributes, type TimeHTMLAttributes } from 'react';

import type { statusColors, textIconColors } from '../../Theme';
import { cx, cxx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';

type FontColor<T> = T extends `font-${infer Color}` ? Color : never;

export type TextFontScale = 'hero' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'p1' | 'p1m' | 'p1b' | 'p2' | 'p2m' | 'p2b' | 'c1' | 'c2' | 'micro';

/** A semantic text or status font token. */
export type TextColor = FontColor<keyof typeof textIconColors> | keyof typeof statusColors;

export type TextProps = ElementProps<
	HTMLElement,
	HTMLAttributes<HTMLElement> &
		Pick<LabelHTMLAttributes<HTMLLabelElement>, 'htmlFor'> &
		Pick<TimeHTMLAttributes<HTMLTimeElement>, 'dateTime'>
> & {
	/** The element it renders: a heading, a paragraph or a label says what the text is to assistive technology. */
	is?:
		| 'div'
		| 'span'
		| 'p'
		| 'h1'
		| 'h2'
		| 'h3'
		| 'h4'
		| 'h5'
		| 'h6'
		| 'label'
		| 'legend'
		| 'strong'
		| 'em'
		| 'small'
		| 'time'
		| 'dt'
		| 'dd'
		| 'li'
		| 'figcaption';
	/** The size, weight and line height; without it, the text takes the ones around it. */
	fontScale?: TextFontScale;
	/** The colour; without it, the text takes the colour around it. */
	color?: TextColor;
	/** Keeps the text on one line, cut with an ellipsis when it does not fit. */
	truncate?: boolean;
};

/**
 * Text set in one of the design system's font scales and text colours.
 */
function Text({ is = 'div', fontScale, color, truncate, className, ...props }: TextProps) {
	return createElement(is, {
		className: cx(cxx('rcx-text')(fontScale && `font-scale-${fontScale}`, color && `color-${color}`, truncate && 'truncate'), className),
		...props,
	});
}

export default Text;
