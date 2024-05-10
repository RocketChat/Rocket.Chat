import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const actionWithLinearScale: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'linear_scale',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        minValue: 0,
        maxValue: 8,
        initialValue: 5,
      },
    ],
  },
];
