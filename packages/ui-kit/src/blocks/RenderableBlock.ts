import type { Block } from './Block.js';
import type { ConditionalBlock } from './layout/ConditionalBlock.js';

export type RenderableBlock = Exclude<Block, ConditionalBlock>;
