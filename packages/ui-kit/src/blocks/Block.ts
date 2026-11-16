import type { BlockElement } from './BlockElement.js';
import type { LayoutBlock } from './LayoutBlock.js';
import type { TextObject } from './TextObject.js';

export type Block = TextObject | BlockElement | LayoutBlock;
