import type { LayoutBlockish } from '../LayoutBlockish';
import type { TextObject } from '../TextObject';
import type { ImageElement } from '../elements/ImageElement';

export type ContextBlockElements = TextObject | ImageElement;
export type ContextBlock = LayoutBlockish<{
	type: 'context';
	elements: readonly ContextBlockElements[];
}>;
