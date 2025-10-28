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
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Option 1',
            },
            value: 'value-1',
          },
          {
            text: {
              type: 'plain_text',
              text: 'Option initial',
            },
            value: 'value-2',
          },
        ],
        initialOption: {
          text: {
            type: 'plain_text',
            text: 'Option initial',
          },
          value: 'value-2',
        },
      },
    ],
  },
];
