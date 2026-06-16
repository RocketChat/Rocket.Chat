import type { Meta, StoryObj } from '@storybook/preact';
import { action } from 'storybook/actions';

import { renderMessageBlocks } from '.';
import Surface from './Surface';

export default {
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(storyFn) => <div style={{ width: '100vw', maxWidth: 500 }}>{storyFn()}</div>,
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

export const AllSelects: StoryObj = {
	name: 'all selects',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};

export const FilteredConversationsSelect: StoryObj = {
	name: 'filtered conversations select',
	render: () => (
		<>
			{renderMessageBlocks([
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
								include: ['private'],
							},
						},
					],
				},
			])}
		</>
	),
};

export const SelectsWithInitialOptions: StoryObj = {
	name: 'selects with initial options',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};

export const Button: StoryObj = {
	name: 'button',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};

export const DatePicker: StoryObj = {
	name: 'datepicker',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};
