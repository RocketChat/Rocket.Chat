import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const contextWithPlainText: readonly LayoutBlock[] = [
  {
    type: 'context',
    elements: [
      {
        type: 'plain_text',
        text: 'Author: Vivek Srivastava',
        emoji: true,
      },
    ],
  },
];

export const contextWithMrkdwn: readonly LayoutBlock[] = [
  {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: '*This* is :smile: markdown',
      },
    ],
  },
];

export const contextWithImage: readonly LayoutBlock[] = [
  {
    type: 'context',
    elements: [
      {
        type: 'image',
        imageUrl: 'https://picsum.photos/200/300',
        altText: 'An image',
      },
    ],
  },
];

export const contextWithAllElements: readonly LayoutBlock[] = [
  {
    type: 'context',
    elements: [
      {
        type: 'plain_text',
        text: 'Author: Vivek Srivastava',
        emoji: true,
      },
      {
        type: 'image',
        imageUrl: 'https://picsum.photos/200/300',
        altText: 'An image',
      },
      {
        type: 'mrkdwn',
        text: '*This* is :smile: markdown',
      },
    ],
  },
];
