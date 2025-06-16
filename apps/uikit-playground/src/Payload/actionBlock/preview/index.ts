import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const previewPlain: readonly LayoutBlock[] = [
  {
    type: 'preview',
    title: [
      {
        type: 'plain_text',
        text: 'Vivek',
        emoji: true,
      },
    ],
    description: [
      {
        type: 'plain_text',
        text: 'I Need a Description',
        emoji: true,
      },
    ],
    footer: {
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: 'Srivastava',
        },
      ],
    },
  },
];

export const previewWithImage: readonly LayoutBlock[] = [
  {
    type: 'preview',
    title: [
      {
        type: 'plain_text',
        text: 'Vivek',
        emoji: true,
      },
    ],
    description: [
      {
        type: 'plain_text',
        text: 'I Need a Description',
        emoji: true,
      },
    ],
    thumb: { url: 'https://picsum.photos/200/300' },
    footer: {
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: 'Srivastava',
        },
      ],
    },
  },
];

export const previewWithUrl: readonly LayoutBlock[] = [
  {
    type: 'preview',
    title: [
      {
        type: 'plain_text',
        text: 'Vivek',
        emoji: true,
      },
    ],
    description: [
      {
        type: 'plain_text',
        text: 'I Need a Description',
        emoji: true,
      },
    ],
    footer: {
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: 'Srivastava',
        },
      ],
    },
    externalUrl: 'https://rocket.chat',
  },
];

export const previewWithImageAndUrl: readonly LayoutBlock[] = [
  {
    type: 'preview',
    title: [
      {
        type: 'plain_text',
        text: 'Vivek',
        emoji: true,
      },
    ],
    description: [
      {
        type: 'plain_text',
        text: 'I Need a Description',
        emoji: true,
      },
    ],
    thumb: { url: 'https://picsum.photos/200/300' },
    footer: {
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: 'Srivastava',
        },
      ],
    },
    // externalUrl: 'https://rocket.chat',
  },
];
