import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const actionWithTabNavigation: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'tab_navigation',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        options: [
          {
            value: 'tab_1',
            text: {
              type: 'plain_text',
              text: 'lorem ipsum',
            },
          },
          {
            value: 'tab_2',
            text: {
              type: 'plain_text',
              text: 'dolor sit amet',
            },
          },
          {
            value: 'tab_3',
            text: {
              type: 'plain_text',
              text: 'dolor sit amet',
            },
            disabled: true,
          },
        ],
      },
    ],
  },
];
