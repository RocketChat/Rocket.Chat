import type { CardBlock } from './CardBlock';
import type { LayoutBlockish } from '../LayoutBlockish';

/** Cards in a row that scrolls sideways; from 1 to 10 cards. */
export type CarouselBlock = LayoutBlockish<{
	type: 'carousel';
	elements: readonly CardBlock[];
}>;
