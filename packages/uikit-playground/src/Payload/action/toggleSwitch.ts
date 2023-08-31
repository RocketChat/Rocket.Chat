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
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Toggle 1',
            },
            value: 'value-1',
          },
          {
            text: {
              type: 'plain_text',
              text: 'Toggle initial option',
            },
            value: 'value-2',
          },
        ],
        initialOptions: [
          {
            text: {
              type: 'plain_text',
              text: 'Toggle initial option',
            },
            value: 'value-2',
          },
        ],
      },
    ],
  },
];
