import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const sectionWithdatePicker: readonly LayoutBlock[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Pick a date for the deadline.',
    },
    accessory: {
      type: 'datepicker',
      appId: 'app-id',
      blockId: 'block-id',
      actionId: 'action-id',
      initialDate: '1990-04-28',
      placeholder: {
        type: 'plain_text',
        text: 'Select a date',
        emoji: true,
      },
    },
  },
];
