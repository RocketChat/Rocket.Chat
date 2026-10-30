import type { Block } from './Block.js';
import type { TextObject } from './TextObject.js';
import { TextObjectType } from './TextObjectType.js';

export const isTextObject = (block: Block): block is TextObject => (Object.values(TextObjectType) as string[]).includes(block.type);
