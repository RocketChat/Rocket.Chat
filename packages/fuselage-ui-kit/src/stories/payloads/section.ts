import type * as UiKit from '@rocket.chat/ui-kit';

export const sectionWithPlainText: readonly UiKit.LayoutBlock[] = [
  {
    type: 'section',
    text: {
      type: 'plain_text',
      text: 'This is a plain text section block.',
      emoji: true,
    },
  },
] as const;

export const sectionWithMrkdwn: readonly UiKit.LayoutBlock[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'This is a mrkdwn section block :ghost: *this is bold*, and ~this is crossed out~, and <https://google.com|this is a link>',
    },
  },
] as const;

export const sectionWithTextFields: readonly UiKit.LayoutBlock[] = [
  {
    type: 'section',
    fields: [
      {
        type: 'plain_text',
        text: '*this is plain_text text*',
        emoji: true,
      },
      {
        type: 'plain_text',
        text: '*this is plain_text text*',
        emoji: true,
      },
      {
        type: 'plain_text',
        text: '*this is plain_text text*',
        emoji: true,
      },
      {
        type: 'plain_text',
        text: '*this is plain_text text*',
        emoji: true,
      },
      {
        type: 'plain_text',
        text: '*this is plain_text text*',
        emoji: true,
      },
    ],
  },
] as const;

export const sectionWithButtonAccessory: readonly UiKit.LayoutBlock[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'This is a section block with a button.',
    },
    accessory: {
      appId: 'dummy-app-id',
      blockId: 'dummy-block-id',
      actionId: 'dummy-action-id',
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Click Me',
        emoji: true,
      },
      value: 'click_me_123',
    },
  },
] as const;

export const sectionWithImageAccessory: readonly UiKit.LayoutBlock[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'This is a section block with an accessory image.',
    },
    accessory: {
      type: 'image',
      imageUrl:
        'data:image/jpeg;base64,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',
      altText: 'cute cat',
    },
  },
] as const;

export const sectionWithOverflowMenuAccessory: readonly UiKit.LayoutBlock[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'This is a section block with an overflow menu.',
    },
    accessory: {
      appId: 'dummy-app-id',
      blockId: 'dummy-block-id',
      actionId: 'dummy-action-id',
      type: 'overflow',
      options: [
        {
          text: {
            type: 'plain_text',
            text: '*this is plain_text text*',
            emoji: true,
          },
          value: 'value-0',
        },
        {
          text: {
            type: 'plain_text',
            text: '*this is plain_text text*',
            emoji: true,
          },
          value: 'value-1',
        },
        {
          text: {
            type: 'plain_text',
            text: '*this is plain_text text*',
            emoji: true,
          },
          value: 'value-2',
        },
        {
          text: {
            type: 'plain_text',
            text: '*this is plain_text text*',
            emoji: true,
          },
          value: 'value-3',
        },
        {
          text: {
            type: 'plain_text',
            text: '*this is plain_text text*',
            emoji: true,
          },
          value: 'value-4',
        },
      ],
    },
  },
] as const;

export const sectionWithDatePickerAccessory: readonly UiKit.LayoutBlock[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Pick a date for the deadline.',
    },
    accessory: {
      appId: 'dummy-app-id',
      blockId: 'dummy-block-id',
      actionId: 'dummy-action-id',
      type: 'datepicker',
      initialDate: '1990-04-28',
      placeholder: {
        type: 'plain_text',
        text: 'Select a date',
        emoji: true,
      },
    },
  },
] as const;
