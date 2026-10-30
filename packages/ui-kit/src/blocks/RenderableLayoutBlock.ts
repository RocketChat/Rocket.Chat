import type { LayoutBlock } from './LayoutBlock.js';
import type { ConditionalBlock } from './layout/ConditionalBlock.js';

export type RenderableLayoutBlock = Exclude<LayoutBlock, ConditionalBlock>;
