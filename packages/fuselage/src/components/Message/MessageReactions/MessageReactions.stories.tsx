import type { Meta, StoryObj } from '@storybook/react';

import { BasicMessageTemplate } from '../helpers.js';
import MessageReaction from './MessageReaction.js';
import MessageReactionAction from './MessageReactionAction.js';
import MessageReactionCounter from './MessageReactionCounter.js';
import MessageReactionEmoji from './MessageReactionEmoji.js';
import MessageReactions from './MessageReactions.js';

export default {
	title: 'Message/MessageReactions',
	component: MessageReactions,
	subcomponents: {
		MessageReaction,
		MessageReactionAction,
	},
	argTypes: {
		children: {
			control: false,
			description: 'Reaction pills content, composed from MessageReaction and MessageReactionAction subcomponents.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof MessageReactions>;

type Story = StoryObj<typeof MessageReactions>;

const reactions = (
	<MessageReactions>
		<MessageReaction title='reaction 1' mine>
			<MessageReactionCounter counter={1} />
		</MessageReaction>
		<MessageReaction title='reaction 2'>
			<MessageReactionCounter counter={2} />
		</MessageReaction>
		<MessageReaction title='reaction 3'>
			<MessageReactionCounter counter={3} />
		</MessageReaction>
		<MessageReaction title='grinning' mine>
			<MessageReactionEmoji name='grinning'>😀</MessageReactionEmoji>
			<MessageReactionCounter counter={5} />
		</MessageReaction>
		<MessageReaction title='rocket'>
			<MessageReactionEmoji name='rocket'>🚀</MessageReactionEmoji>
			<MessageReactionCounter counter={2} />
		</MessageReaction>
		<MessageReactionAction title='action' />
	</MessageReactions>
);

export const Default: Story = {
	render: () => <BasicMessageTemplate reactions={reactions} />,
};
