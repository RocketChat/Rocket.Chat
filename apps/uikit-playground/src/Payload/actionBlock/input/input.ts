import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const inputWithSingleLineInput: readonly LayoutBlock[] = [
  {
    type: 'input',
    element: {
      type: 'plain_text_input',
      appId: 'app-id',
      blockId: 'block-id',
      actionId: 'action-id',
      placeholder: {
        type: 'plain_text',
        text: 'Enter name',
        emoji: true,
      },
      initialValue: 'Vivek Srivastava',
      multiline: false,
    },
    label: {
      type: 'plain_text',
      text: 'Label',
      emoji: true,
    },
  },
];

export const inputWithMultiLineInput: readonly LayoutBlock[] = [
  {
    type: 'input',
    element: {
      type: 'plain_text_input',
      appId: 'app-id',
      blockId: 'block-id',
      actionId: 'action-id',
      placeholder: {
        type: 'plain_text',
        text: 'Enter name',
        emoji: true,
      },
      initialValue: 'Vivek Srivastava',
      multiline: true,
    },
    label: {
      type: 'plain_text',
      text: 'Label',
      emoji: true,
    },
  },
];
