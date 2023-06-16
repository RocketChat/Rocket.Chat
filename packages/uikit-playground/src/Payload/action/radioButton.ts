import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const actionWithRadioButton: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'radio_button',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        value: true,
      },
    ],
  },
];
