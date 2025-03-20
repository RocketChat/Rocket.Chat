import type { Block } from './Block';
import type { TextObject } from './TextObject';
import { TextObjectType } from './TextObjectType';

export const isTextObject = (block: Block): block is TextObject => (Object.values(TextObjectType) as string[]).includes(block.type);
