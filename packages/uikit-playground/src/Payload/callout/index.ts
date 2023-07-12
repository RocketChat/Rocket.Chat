import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const callout: readonly LayoutBlock[] = [
  {
    type: 'callout',
    appId: 'app-id',
    blockId: 'block-id',
    title: {
      type: 'plain_text',
      text: 'Callout Title',
    },
    text: {
      type: 'plain_text',
      text: 'Callout Text',
    },
    icon: 'rocket',
  },
];
