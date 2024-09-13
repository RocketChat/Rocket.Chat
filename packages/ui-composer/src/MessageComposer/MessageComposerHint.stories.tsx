import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { MessageComposerHint } from '.';
import '@rocket.chat/icons/dist/rocketchat.css';

export default {
	title: 'Components/MessageComposer/Hint',
	component: MessageComposerHint,
} as ComponentMeta<typeof MessageComposerHint>;

export const Editing: ComponentStory<typeof MessageComposerHint> = () => {
	const helperText = (
		<>
			<strong>esc</strong> to cancel · <strong>enter</strong> to save
		</>
	);

	return (
		<MessageComposerHint icon='pencil' helperText={helperText}>
			Editing message
		</MessageComposerHint>
	);
};

export const ReadOnly: ComponentStory<typeof MessageComposerHint> = () => <MessageComposerHint>This room is read only</MessageComposerHint>;

export const UnencryptedMessage: ComponentStory<typeof MessageComposerHint> = () => (
	<MessageComposerHint>You're sending an unencrypted message</MessageComposerHint>
);
