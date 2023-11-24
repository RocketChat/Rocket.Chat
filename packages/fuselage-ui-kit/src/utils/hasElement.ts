import type * as UiKit from '@rocket.chat/ui-kit';

type LayoutBlockWithElement = Extract<
  UiKit.LayoutBlock,
  { element: UiKit.BlockElement | UiKit.TextObject }
>;

export const hasElement = (
  block: UiKit.LayoutBlock
): block is LayoutBlockWithElement => 'element' in block;
