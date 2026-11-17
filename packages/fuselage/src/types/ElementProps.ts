import type { HTMLAttributes, RefAttributes } from 'react';

import type { StylingProps } from '../components/Box/stylingProps';

/**
 * The DOM and ARIA attributes a component forwards to the element it renders, without the ones `Box` would read as
 * styling props (`color`, `width`, `size`…) and the custom-element `is`.
 */
export type ElementProps<TElement extends Element, TAttributes = HTMLAttributes<TElement>> = Omit<TAttributes, keyof StylingProps | 'is'> &
	RefAttributes<TElement>;
