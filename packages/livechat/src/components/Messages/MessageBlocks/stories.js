import MessageBlocks from '.';
import accessoryImage from '../../../../.storybook/assets/accessoryImage.png';
import imageBlock from '../../../../.storybook/assets/imageBlock.png';
import { PopoverContainer } from '../../Popover';

export default {
	title: 'Messages/MessageBlocks',
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(storyFn) => <PopoverContainer children={storyFn()} />,
	],
};

export const WithBlocks = () =>
	<MessageBlocks
		blocks={[
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
					text: 'This is a mrkdwn section block :ghost: *this is bold*, and ~this is crossed out~, and [this is a link](https://google.com)',
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
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'This is a section block with a button.',
				},
				accessory: {
					type: 'button',
					text: {
						type: 'plain_text',
						text: 'Click Me',
						emoji: true,
					},
					value: 'click_me_123',
				},
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'This is a section block with an accessory image.',
				},
				accessory: {
					type: 'image',
					imageUrl: accessoryImage,
					altText: 'Photo by Julian Schultz on Unsplash',
				},
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'This is a section block with an overflow menu.',
				},
				accessory: {
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
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'Pick a date for the deadline.',
				},
				accessory: {
					type: 'datepicker',
					initial_date: '1990-04-28',
					placeholder: {
						type: 'plain_text',
						text: 'Select a date',
						emoji: true,
					},
				},
			},
			{
				type: 'divider',
			},
			{
				type: 'image',
				title: {
					type: 'plain_text',
					text: 'SpaceX Falcon Heavy Launch',
					emoji: true,
				},
				imageUrl: imageBlock,
				altText: 'Photo by SpaceX on Unsplash',
			},
			{
				type: 'image',
				imageUrl: imageBlock,
				altText: 'Photo by SpaceX on Unsplash',
			},
			{
				type: 'actions',
				elements: [
					{
						type: 'conversations_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a conversation',
							emoji: true,
						},
					},
					{
						type: 'channels_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a channel',
							emoji: true,
						},
					},
					{
						type: 'users_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a user',
							emoji: true,
						},
					},
					{
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
			{
				type: 'actions',
				elements: [
					{
						type: 'conversations_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select private conversation',
							emoji: true,
						},
						filter: {
							include: [
								'private',
							],
						},
					},
				],
			},
			{
				type: 'actions',
				elements: [
					{
						type: 'conversations_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a conversation',
							emoji: true,
						},
						initialConversation: 'D123',
					},
					{
						type: 'users_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a user',
							emoji: true,
						},
						initialUser: 'U123',
					},
					{
						type: 'channels_select',
						placeholder: {
							type: 'plain_text',
							text: 'Select a channel',
							emoji: true,
						},
						initialChannel: 'C123',
					},
				],
			},
			{
				type: 'actions',
				elements: [
					{
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
			{
				type: 'actions',
				elements: [
					{
						type: 'datepicker',
						initialDate: '1990-04-28',
						placeholder: {
							type: 'plain_text',
							text: 'Select a date',
							emoji: true,
						},
					},
					{
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
			{
				type: 'context',
				elements: [
					{
						type: 'plain_text',
						text: 'Author: Manuel Puig',
						emoji: true,
					},
				],
			},
			{
				type: 'context',
				elements: [
					{
						type: 'image',
						imageUrl: accessoryImage,
						altText: 'Photo by Julian Schultz on Unsplash',
					},
					{
						type: 'mrkdwn',
						text: '*Julian Schultz* has approved this message.',
					},
				],
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: '*This* is :smile: markdown',
					},
					{
						type: 'image',
						imageUrl: accessoryImage,
						altText: 'Photo by Julian Schultz on Unsplash',
					},
					{
						type: 'image',
						imageUrl: accessoryImage,
						altText: 'Photo by Julian Schultz on Unsplash',
					},
					{
						type: 'image',
						imageUrl: accessoryImage,
						altText: 'Photo by Julian Schultz on Unsplash',
					},
					{
						type: 'plain_text',
						text: 'Author: Manuel Puig',
						emoji: true,
					},
				],
			},
			{
				type: 'conditional',
				when: {
					engine: ['livechat'],
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
		]}
	/>;
WithBlocks.storyName = 'with blocks';
