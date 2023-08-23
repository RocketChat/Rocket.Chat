import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const imageWithTitle: readonly LayoutBlock[] = [
  {
    type: 'image',
    title: {
      type: 'plain_text',
      text: 'I Need a Marg',
      emoji: true,
    },
    imageUrl: 'https://picsum.photos/200/300',
    altText: 'marg',
  },
];

export const imageWithoutTitle: readonly LayoutBlock[] = [
  {
    type: 'image',
    imageUrl: 'https://picsum.photos/200/300',
    altText: 'inspiration',
  },
];
