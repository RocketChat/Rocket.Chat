import type { ComponentMeta, ComponentStory } from '@storybook/react';

import '@rocket.chat/icons/dist/rocketchat.css';
import { MessageComposerDisabled, MessageComposerDisabledAction } from '.';
import MessageComposer from '../MessageComposer/MessageComposer';
import MessageComposerIcon from '../MessageComposer/MessageComposerIcon';

export default {
	title: 'Components/MessageComposer/Locked',
	component: MessageComposer,
} as ComponentMeta<typeof MessageComposer>;

export const messageComposerBlocked: ComponentStory<typeof MessageComposer> = () => (
	<MessageComposerDisabled>
		<MessageComposerIcon name='burger' />
		Feedback text
	</MessageComposerDisabled>
);

export const messageComposerDisabledAction: ComponentStory<typeof MessageComposer> = () => (
	<MessageComposerDisabled>
		Feedback text<MessageComposerDisabledAction onClick={() => undefined}>Button</MessageComposerDisabledAction>
	</MessageComposerDisabled>
);
