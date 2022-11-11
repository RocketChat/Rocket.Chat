import { action } from '@storybook/addon-actions';

import { renderMessageBlocks } from '.';
import Surface from './Surface';

export default {
	title: 'UiKit/Message/Actions block',
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(storyFn) => <div children={storyFn()} style={{ width: '100vw', maxWidth: 500 }} />,
		(storyFn) => (
			<Surface
				children={storyFn()}
				dispatchAction={async (payload) => {
					await new Promise((resolve) => setTimeout(resolve, 1000));
					action('dispatchAction')(payload);
				}}
			/>
		),
	],
};

export const AllSelects = () =>
	renderMessageBlocks([
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
	]);
AllSelects.storyName = 'all selects';

export const FilteredConversationsSelect = () =>
	renderMessageBlocks([
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
	]);
FilteredConversationsSelect.storyName = 'filtered conversations select';

export const SelectsWithInitialOptions = () =>
	renderMessageBlocks([
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
	]);
SelectsWithInitialOptions.storyName = 'selects with initial options';

export const Button = () =>
	renderMessageBlocks([
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
	]);
Button.storyName = 'button';

export const DatePicker = () =>
	renderMessageBlocks([
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
	]);
DatePicker.storyName = 'datepicker';
