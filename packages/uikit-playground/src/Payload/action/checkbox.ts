import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const actionWithCheckbox: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'checkbox',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        value: true,
      },
    ],
  },
];
