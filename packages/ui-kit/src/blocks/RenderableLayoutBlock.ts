import type { LayoutBlock } from './LayoutBlock';
import type { ConditionalBlock } from './layout/ConditionalBlock';

export type RenderableLayoutBlock = Exclude<LayoutBlock, ConditionalBlock>;
