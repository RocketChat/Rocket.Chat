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

export const actionWithButtonSecondary: readonly LayoutBlock[] = [
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
        secondary: true,
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

export const actionWithButtonSuccess: readonly LayoutBlock[] = [
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
        style: 'success',
      },
    ],
  },
];

export const actionWithButtonWarning: readonly LayoutBlock[] = [
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
        style: 'warning',
      },
    ],
  },
];

export const actionWithButtonSecondaryWithVariant: readonly LayoutBlock[] = [
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
        secondary: true,
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
