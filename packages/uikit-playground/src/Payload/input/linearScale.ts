import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const inputWithLinearSelect: readonly LayoutBlock[] = [
  {
    type: 'input',
    element: {
      type: 'linear_scale',
      appId: 'app-id',
      blockId: 'block-id',
      actionId: 'action-id',
      minValue: 0,
      maxValue: 8,
      initialValue: 5,
    },
    label: {
      type: 'plain_text',
      text: 'Label',
      emoji: true,
    },
  },
];
