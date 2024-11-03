import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const actionWithDatePicker: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'datepicker',
        initialDate: '1990-04-28',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        placeholder: {
          type: 'plain_text',
          text: 'Select a date',
          emoji: true,
        },
      },
    ],
  },
];
