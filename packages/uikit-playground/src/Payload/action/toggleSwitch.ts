import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const actionWithToggleSwitch: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'toggle_switch',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        value: true,
      },
    ],
  },
];
