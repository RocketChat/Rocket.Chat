import type * as UiKit from '@rocket.chat/ui-kit';

export const callout: readonly UiKit.LayoutBlock[] = [
  {
    type: 'callout',
    title: {
      type: 'plain_text',
      text: 'Callout',
    },
    text: {
      type: 'plain_text',
      text: 'This is a callout',
    },
    variant: 'info',
  },
] as const;

export const calloutWithAction: readonly UiKit.LayoutBlock[] = [
  {
    type: 'callout',
    title: {
      type: 'plain_text',
      text: 'Callout',
    },
    text: {
      type: 'plain_text',
      text: 'This is a callout',
    },
    variant: 'info',
    accessory: {
      appId: 'dummy-app-id',
      blockId: 'dummy-block-id',
      actionId: 'dummy-action-id',
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Action',
      },
    },
  },
];
