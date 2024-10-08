import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const actionWithMenu: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'overflow',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        options: [
          {
            value: 'option_1',
            text: {
              type: 'plain_text',
              text: 'lorem ipsum 🚀',
              emoji: true,
            },
          },
          {
            value: 'option_2',
            text: {
              type: 'plain_text',
              text: 'lorem ipsum 🚀',
              emoji: true,
            },
          },
        ],
      },
    ],
  },
];
