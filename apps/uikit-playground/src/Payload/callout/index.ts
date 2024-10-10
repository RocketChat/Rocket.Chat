import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const callout: readonly LayoutBlock[] = [
  {
    type: 'callout',
    title: {
      type: 'plain_text',
      text: 'Callout Title',
    },
    text: {
      type: 'plain_text',
      text: 'Callout Text',
    },
  },
];

export const calloutWithAction: readonly LayoutBlock[] = [
  {
    type: 'callout',
    title: {
      type: 'plain_text',
      text: 'Callout Title',
    },
    text: {
      type: 'plain_text',
      text: 'Callout Text',
    },
    accessory: {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Callout Action',
      },
      actionId: 'callout-action',
      blockId: 'callout-action',
      appId: 'A',
    },
  },
];
