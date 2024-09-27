import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { MessageComposerHint } from '.';
import '@rocket.chat/icons/dist/rocketchat.css';

export default {
	title: 'Components/MessageComposer/Hint',
	component: MessageComposerHint,
} as ComponentMeta<typeof MessageComposerHint>;

export const HintWithIconAndHelperText: ComponentStory<typeof MessageComposerHint> = () => {
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

export const HintWithIcon: ComponentStory<typeof MessageComposerHint> = () => (
	<MessageComposerHint icon='eye'>This room is read only</MessageComposerHint>
);

export const HintWithText: ComponentStory<typeof MessageComposerHint> = () => (
	<MessageComposerHint>You're sending an unencrypted message</MessageComposerHint>
);
