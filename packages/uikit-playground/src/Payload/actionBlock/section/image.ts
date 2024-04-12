import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const sectionWithImage: readonly LayoutBlock[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'This is a section block with an accessory image.',
    },
    accessory: {
      type: 'image',
      imageUrl: 'https://picsum.photos/200/300',
      altText: 'cute cat',
    },
  },
];
