import type * as UiKit from '@rocket.chat/ui-kit';

export const inputWithMultilinePlainTextInput: readonly UiKit.LayoutBlock[] = [
  {
    type: 'input',
    element: {
      appId: 'dummy-app-id',
      blockId: 'dummy-block-id',
      type: 'plain_text_input',
      multiline: true,
      actionId: 'input-0',
    },
    label: {
      type: 'plain_text',
      text: 'Label',
      emoji: true,
    },
  },
] as const;

export const inputWithPlainTextInput: readonly UiKit.LayoutBlock[] = [
  {
    type: 'input',
    element: {
      appId: 'dummy-app-id',
      blockId: 'dummy-block-id',
      type: 'plain_text_input',
      actionId: 'input-0',
    },
    label: {
      type: 'plain_text',
      text: 'Label',
      emoji: true,
    },
  },
] as const;

export const inputWithMultiUsersSelect: readonly UiKit.LayoutBlock[] = [
  {
    type: 'input',
    element: {
      appId: 'dummy-app-id',
      blockId: 'dummy-block-id',
      type: 'multi_users_select',
      // placeholder: {
      //   type: 'plain_text',
      //   text: 'Select users',
      //   emoji: true,
      // },
      actionId: 'input-0',
    },
    label: {
      type: 'plain_text',
      text: 'Label',
      emoji: true,
    },
  },
] as const;

export const inputWithStaticSelect: readonly UiKit.LayoutBlock[] = [
  {
    type: 'input',
    element: {
      appId: 'dummy-app-id',
      blockId: 'dummy-block-id',
      type: 'static_select',
      placeholder: {
        type: 'plain_text',
        text: 'Select an item',
        emoji: true,
      },
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
      ],
      actionId: 'input-0',
    },
    label: {
      type: 'plain_text',
      text: 'Label',
      emoji: true,
    },
  },
] as const;

export const inputWithDatePicker: readonly UiKit.LayoutBlock[] = [
  {
    type: 'input',
    element: {
      appId: 'dummy-app-id',
      blockId: 'dummy-block-id',
      type: 'datepicker',
      initialDate: '1990-04-28',
      placeholder: {
        type: 'plain_text',
        text: 'Select a date',
        emoji: true,
      },
      actionId: 'input-0',
    },
    label: {
      type: 'plain_text',
      text: 'Label',
      emoji: true,
    },
  },
] as const;

export const inputWithLinearScale: readonly UiKit.LayoutBlock[] = [
  {
    type: 'input',
    element: {
      appId: 'dummy-app-id',
      blockId: 'dummy-block-id',
      type: 'linear_scale',
      minValue: 0,
      maxValue: 10,
      initialValue: 7,
      actionId: 'input-0',
    },
    label: {
      type: 'plain_text',
      text: 'Label',
      emoji: true,
    },
  },
] as const;
