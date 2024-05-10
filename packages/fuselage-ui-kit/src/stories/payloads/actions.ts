import type * as UiKit from '@rocket.chat/ui-kit';

export const actionsWithAllSelects: readonly UiKit.LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        appId: 'dummy-app-id',
        blockId: 'dummy-block-id',
        actionId: 'dummy-action-id',
        type: 'conversations_select',
        // placeholder: {
        //   type: 'plain_text',
        //   text: 'Select a conversation',
        //   emoji: true,
        // },
      },
      {
        appId: 'dummy-app-id',
        blockId: 'dummy-block-id',
        actionId: 'dummy-action-id',
        type: 'channels_select',
        // placeholder: {
        //   type: 'plain_text',
        //   text: 'Select a channel',
        //   emoji: true,
        // },
      },
      {
        appId: 'dummy-app-id',
        blockId: 'dummy-block-id',
        actionId: 'dummy-action-id',
        type: 'users_select',
        // placeholder: {
        //   type: 'plain_text',
        //   text: 'Select a user',
        //   emoji: true,
        // },
      },
      {
        appId: 'dummy-app-id',
        blockId: 'dummy-block-id',
        actionId: 'dummy-action-id',
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
      },
    ],
  },
] as const;

export const actionsWithFilteredConversationsSelect: readonly UiKit.LayoutBlock[] =
  [
    {
      type: 'actions',
      elements: [
        {
          appId: 'dummy-app-id',
          blockId: 'dummy-block-id',
          actionId: 'dummy-action-id',
          type: 'conversations_select',
          // placeholder: {
          //   type: 'plain_text',
          //   text: 'Select private conversation',
          //   emoji: true,
          // },
          // filter: {
          //   include: ['private'],
          // },
        },
      ],
    },
  ] as const;

export const actionsWithInitializedSelects: readonly UiKit.LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        appId: 'dummy-app-id',
        blockId: 'dummy-block-id',
        actionId: 'dummy-action-id',
        type: 'conversations_select',
        // placeholder: {
        //   type: 'plain_text',
        //   text: 'Select a conversation',
        //   emoji: true,
        // },
        // initialConversation: 'D123',
      },
      {
        appId: 'dummy-app-id',
        blockId: 'dummy-block-id',
        actionId: 'dummy-action-id',
        type: 'users_select',
        // placeholder: {
        //   type: 'plain_text',
        //   text: 'Select a user',
        //   emoji: true,
        // },
        // initialUser: 'U123',
      },
      {
        appId: 'dummy-app-id',
        blockId: 'dummy-block-id',
        actionId: 'dummy-action-id',
        type: 'channels_select',
        // placeholder: {
        //   type: 'plain_text',
        //   text: 'Select a channel',
        //   emoji: true,
        // },
        // initialChannel: 'C123',
      },
    ],
  },
] as const;

export const actionsWithButton: readonly UiKit.LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
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
    ],
  },
] as const;

export const actionsWithButtonAsLink: readonly UiKit.LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
        appId: 'dummy-app-id',
        blockId: 'dummy-block-id',
        actionId: 'dummy-action-id',
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Click Me',
          emoji: true,
        },
        url: 'https://rocket.chat',
        value: 'click_me_123',
      },
    ],
  },
] as const;

export const actionsWithDatePicker: readonly UiKit.LayoutBlock[] = [
  {
    type: 'actions',
    elements: [
      {
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
      {
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
    ],
  },
] as const;
