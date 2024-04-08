import type { Block } from './Block';
import type { ConditionalBlock } from './layout/ConditionalBlock';

export type RenderableBlock = Exclude<Block, ConditionalBlock>;
