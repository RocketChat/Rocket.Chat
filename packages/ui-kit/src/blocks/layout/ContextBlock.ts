import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { TextObject } from '../TextObject.js';
import type { ImageElement } from '../elements/ImageElement.js';

export type ContextBlockElements = TextObject | ImageElement;
export type ContextBlock = LayoutBlockish<{
	type: 'context';
	elements: readonly ContextBlockElements[];
}>;
