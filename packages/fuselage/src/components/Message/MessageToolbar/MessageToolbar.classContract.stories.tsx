import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';

import MessageToolbar from './MessageToolbar';
import MessageToolbarItem from './MessageToolbarItem';
import MessageToolbarWrapper from './MessageToolbarWrapper';
import { classContract } from '../../../testing/g0';

// The class contract of the message toolbar, with and without `visible`, with the IconButton frame in it, which holds its glyph in a content part: `button > span > i`.
export default {
	title: 'Characterization/MessageToolbarClassContract',
	component: MessageToolbar,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof MessageToolbar>;

type Story = StoryObj<typeof MessageToolbar>;

export const ClassContract: Story = {
	render: () => (
		<>
			<MessageToolbarWrapper>
				<MessageToolbar>
					<MessageToolbarItem icon='quote' title='Quote' />
				</MessageToolbar>
			</MessageToolbarWrapper>
			<MessageToolbarWrapper visible>
				<MessageToolbar>
					<MessageToolbarItem icon='quote' title='Quote' />
				</MessageToolbar>
			</MessageToolbarWrapper>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div[0]: rcx-message-toolbar__wrapper',
				'root > div[0] > div: rcx-message-toolbar',
				'root > div[0] > div > div: rcx-button-group rcx-button-group--align-start rcx-button-group--small',
				'root > div[0] > div > div > button: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--small-square rcx-button--square',
				'root > div[0] > div > div > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-quote',
				'root > div[1]: rcx-message-toolbar__wrapper rcx-message-toolbar__wrapper--visible',
				'root > div[1] > div: rcx-message-toolbar',
				'root > div[1] > div > div: rcx-button-group rcx-button-group--align-start rcx-button-group--small',
				'root > div[1] > div > div > button: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--small-square rcx-button--square',
				'root > div[1] > div > div > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-quote',
			].join('\n'),
		);
	},
};
