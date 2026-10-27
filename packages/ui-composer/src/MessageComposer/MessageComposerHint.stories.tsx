import type { Meta, StoryObj } from '@storybook/react';

import { MessageComposerHint } from '.';

export default {
	component: MessageComposerHint,
} as Meta<typeof MessageComposerHint>;

export const HintWithIconAndHelperText: StoryObj<typeof MessageComposerHint> = {
	render: () => {
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
	},
};

export const HintWithIcon: StoryObj<typeof MessageComposerHint> = {
	render: () => <MessageComposerHint icon='eye'>This room is read only</MessageComposerHint>,
};

export const HintWithText: StoryObj<typeof MessageComposerHint> = {
	render: () => <MessageComposerHint>You&apos;re sending an unencrypted message</MessageComposerHint>,
};
