import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import Reactions from './Reactions';
import { MessageInteractionsContext, messageInteractionsDefaultValue } from '../contexts/MessageInteractionsContext';

const message = createFakeMessage({
	_id: 'reacted-message',
	reactions: {
		':thumbsup:': { usernames: ['alice', 'bob', 'carol'] },
		':tada:': { usernames: ['john.doe'] },
		':eyes:': { usernames: ['dave'] },
	},
});

const meta = {
	title: 'Components/Message/Content/Reactions',
	component: Reactions,
	decorators: [
		mockAppRoot()
			.withJohnDoe()
			.withTranslations('en', 'core', { Add_Reaction: 'Add reaction', React_with__reaction__: 'React with {{reaction}}' })
			.buildStoryDecorator(),
	],
	parameters: { layout: 'padded' },
	args: { message },
} satisfies Meta<typeof Reactions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleReaction: Story = {
	args: { message: { ...message, reactions: { ':rocket:': { usernames: ['alice'] } } } },
};

export const ReactedByViewer: Story = {
	decorators: [
		(fn) => (
			<MessageInteractionsContext.Provider
				value={{
					...messageInteractionsDefaultValue,
					hasReacted: (reactedMessage, reaction) => Boolean(reactedMessage.reactions?.[reaction]?.usernames.includes('john.doe')),
				}}
			>
				{fn()}
			</MessageInteractionsContext.Provider>
		),
	],
};
