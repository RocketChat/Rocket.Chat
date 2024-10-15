import type { Meta, StoryFn } from '@storybook/react';

import { MessageComposerHint } from '.';
import '@rocket.chat/icons/dist/rocketchat.css';

export default {
	title: 'Components/MessageComposer/Hint',
	component: MessageComposerHint,
} as Meta<typeof MessageComposerHint>;

export const HintWithIconAndHelperText: StoryFn<typeof MessageComposerHint> = () => {
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

export const HintWithIcon: StoryFn<typeof MessageComposerHint> = () => (
	<MessageComposerHint icon='eye'>This room is read only</MessageComposerHint>
);

export const HintWithText: StoryFn<typeof MessageComposerHint> = () => (
	<MessageComposerHint>You're sending an unencrypted message</MessageComposerHint>
);
