import type { Meta, StoryObj } from '@storybook/preact';
import { action } from 'storybook/actions';

import { renderMessageBlocks } from '.';
import Surface from './Surface';
import { accessoryImage } from '../../../../.storybook/helpers';
import { PopoverContainer } from '../../Popover';

export default {
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(storyFn) => <div style={{ width: '100vw', maxWidth: 500 }}>{storyFn()}</div>,
		(storyFn) => <PopoverContainer>{storyFn()}</PopoverContainer>,
		(storyFn) => (
			<Surface
				dispatchAction={async (payload: unknown) => {
					await new Promise((resolve) => setTimeout(resolve, 1000));
					action('dispatchAction')(payload);
				}}
			>
				{storyFn()}
			</Surface>
		),
	],
} satisfies Meta;

export const TextAsPlainText: StoryObj = {
	name: 'text as plain_text',
	render: () => (
		<>
			{renderMessageBlocks([
				{
					type: 'section',
					text: {
						type: 'plain_text',
						text: 'This is a plain text section block.',
						emoji: true,
					},
				},
			])}
		</>
	),
};

export const TextAsMarkdown: StoryObj = {
	name: 'text as mrkdwn',
	render: () => (
		<>
			{renderMessageBlocks([
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: 'This is a mrkdwn section block :ghost: *this is bold*, and ~this is crossed out~, and [this is a link](https://google.com)',
					},
				},
			])}
		</>
	),
};

export const TextFields: StoryObj = {
	name: 'text fields',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};

export const AccessoryAsButton: StoryObj = {
	name: 'accessory as button',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};

export const AccessoryAsImage: StoryObj = {
	name: 'accessory as image',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};

export const AccessoryAsOverflowMenu: StoryObj = {
	name: 'accessory as overflow menu',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};

export const AccessoryAsDatePicker: StoryObj = {
	name: 'accessory as datepicker',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};
