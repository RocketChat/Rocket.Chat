import type * as UiKit from '@rocket.chat/ui-kit';

export const conditional: readonly UiKit.LayoutBlock[] = [
  {
    type: 'conditional',
    when: {
      engine: ['rocket.chat'],
    },
    render: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'This is a plain text section block.',
          emoji: true,
        },
      },
    ],
  },
] as const;
