import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const actionWithButtonDefault: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        text: {
          type: 'plain_text',
          text: 'Click Me',
          emoji: true,
        },
      },
    ],
  },
];

export const actionWithButtonPrimary: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        text: {
          type: 'plain_text',
          text: 'Click Me',
          emoji: true,
        },
        style: 'primary',
      },
    ],
  },
];

export const actionWithButtonDanger: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        text: {
          type: 'plain_text',
          text: 'Click Me',
          emoji: true,
        },
        style: 'danger',
      },
    ],
  },
];

export const actionWithButtonAsLink: readonly LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        appId: 'app-id',
        blockId: 'block-id',
        actionId: 'action-id',
        text: {
          type: 'plain_text',
          text: 'Click Me',
          emoji: true,
        },
        url: 'https://rocket.chat',
      },
    ],
  },
];
