import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const actionWithToastBar: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'toast_bar',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        text: {
          type: 'plain_text',
          text: 'Toast Bar',
        }
      },
    ],
  },
];
