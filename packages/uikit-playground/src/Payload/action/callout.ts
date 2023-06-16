import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const actionWithCallout: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'callout',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        value: 'Callout',
        title: {
          type: 'plain_text',
          text: 'Callout Title',
        },
        text: {
          type: 'plain_text',
          text: 'Callout Text',
        },
      },
    ],
  },
];
