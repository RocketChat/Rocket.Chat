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
            text: 'lorem ipsum 🚀',
            selected: true,
          },
          {
            value: 'tab_2',
            text: 'lorem ipsum 🚀',
            disabled: true,
          },
        ],
      },
    ],
  },
];
