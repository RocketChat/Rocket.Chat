import type { LayoutBlock } from '@rocket.chat/ui-kit';
import { SurfaceOptions } from '../Components/Preview/Display/Surface/constant';

type payload = {
  surface: SurfaceOptions;
  blocks: LayoutBlock[];
};

export type templateType = {
  heading: string;
  description: string;
  payloads: payload[];
};

export const templates: templateType[] = [
  {
    heading: 'Approval',
    description: 'Example message for receiving and responding to requests.',
    payloads: [
      {
        surface: SurfaceOptions.Message,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Looks like you have a scheduling conflict with this event:',
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Iris Zelda 1-1 Tuesday, January 21 4:00-4:30pm Building 2 - Havarti Cheese (3) 2 guests',
            },
            accessory: {
              type: 'image',
              imageUrl:
                'https://api.slack.com/img/blocks/bkb_template_images/notifications.png',
              altText: 'calendar thumbnail',
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'image',
                imageUrl:
                  'https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png',
                altText: 'notifications warning icon',
              },
              {
                type: 'mrkdwn',
                text: 'Conflicts with Team Huddle: 4:15-4:30pm',
              },
            ],
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Propose a new time:',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Today - 4:30-5pm Everyone is available: @iris, @zelda',
            },
            accessory: {
              type: 'button',
              appId: 'app-id',
              blockId: 'block-id',
              actionId: 'action-id',
              text: {
                type: 'plain_text',
                emoji: true,
                text: 'Choose',
              },
              value: 'click_me_123',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Tomorrow - 4-4:30pm Everyone is available: @iris, @zelda',
            },
            accessory: {
              type: 'button',
              appId: 'app-id',
              blockId: 'block-id',
              actionId: 'action-id',
              text: {
                type: 'plain_text',
                emoji: true,
                text: 'Choose',
              },
              value: 'click_me_123',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: "Tomorrow - 6-6:30pm Some people aren't available: @iris, ~@zelda~",
            },
            accessory: {
              type: 'button',
              appId: 'app-id',
              blockId: 'block-id',
              actionId: 'action-id',
              text: {
                type: 'plain_text',
                emoji: true,
                text: 'Choose',
              },
              value: 'click_me_123',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Show more times',
            },
          },
        ],
      },
      {
        surface: SurfaceOptions.Message,
        blocks: [
          {
            type: 'actions',
            elements: [
              {
                type: 'overflow',
                appId: 'app-id',
                blockId: 'block-id',
                actionId: 'action-id',
                options: [
                  {
                    value: 'option_1',
                    text: {
                      type: 'plain_text',
                      text: 'lorem ipsum 🚀',
                      emoji: true,
                    },
                  },
                  {
                    value: 'option_2',
                    text: {
                      type: 'plain_text',
                      text: 'lorem ipsum 🚀',
                      emoji: true,
                    },
                  },
                ],
              },
            ],
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                appId: 'app-id',
                blockId: 'block-id',
                actionId: 'action-id',
                text: {
                  type: 'plain_text',
                  text: 'Click Me',
                  emoji: true,
                },
              },
            ],
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                appId: 'app-id',
                blockId: 'block-id',
                actionId: 'action-id',
                text: {
                  type: 'plain_text',
                  text: 'Click Me',
                  emoji: true,
                },
                style: 'primary',
              },
            ],
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                appId: 'app-id',
                blockId: 'block-id',
                actionId: 'action-id',
                text: {
                  type: 'plain_text',
                  text: 'Click Me',
                  emoji: true,
                },
                style: 'danger',
              },
            ],
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                appId: 'app-id',
                blockId: 'block-id',
                actionId: 'action-id',
                text: {
                  type: 'plain_text',
                  text: 'Click Me',
                  emoji: true,
                },
                url: 'https://rocket.chat',
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'This is a plain text section block.',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'This is a mrkdwn section block :ghost: *this is bold*, and ~this is crossed out~, and <https://google.com|this is a link>',
            },
          },
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
        ],
      },
    ],
  },
  {
    heading: 'Notification',
    description:
      'Example message for getting updates on new info and taking relevant action.',
    payloads: [
      {
        surface: SurfaceOptions.Message,
        blocks: [
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
            thumb: {
              url: 'https://picsum.photos/200/300',
            },
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
            thumb: {
              url: 'https://picsum.photos/200/300',
            },
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
          {
            type: 'image',
            imageUrl: 'https://picsum.photos/200/300',
            altText: 'inspiration',
          },
        ],
      },
    ],
  },
];
