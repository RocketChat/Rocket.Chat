import type { Meta, StoryObj } from '@storybook/react';

import {
	MessageComposer,
	MessageComposerAction,
	MessageComposerToolbarActions,
	MessageComposerToolbar,
	MessageComposerActionsDivider,
	MessageComposerToolbarSubmit,
	MessageComposerHint,
	RichTextComposerInput,
} from '.';

export default {
	component: RichTextComposerInput,
	title: 'MessageComposer/RichTextComposerInput',
} satisfies Meta<typeof RichTextComposerInput>;

const MessageToolbarActions = () => (
	<MessageComposerToolbarActions>
		<MessageComposerAction icon='emoji' />
		<MessageComposerActionsDivider />
		<MessageComposerAction icon='bold' />
		<MessageComposerAction icon='italic' />
		<MessageComposerAction icon='underline' />
		<MessageComposerAction icon='strike' />
		<MessageComposerAction icon='code' />
		<MessageComposerAction icon='multiline' />
		<MessageComposerAction icon='link' />
		<MessageComposerAction icon='katex' />
		<MessageComposerAction icon='arrow-return' />
		<MessageComposerActionsDivider />
		<MessageComposerAction icon='mic' />
		<MessageComposerAction icon='video' />
		<MessageComposerAction icon='clip' />
		<MessageComposerAction icon='plus' />
	</MessageComposerToolbarActions>
);

export const Default: StoryObj<typeof RichTextComposerInput> = {
	render: () => (
		<>
			<MessageComposerHint icon='flask' helperText=''>
				Experiment: Real Time Composer
			</MessageComposerHint>
			<MessageComposer>
				<RichTextComposerInput placeholder='Type a message...' />
				<MessageComposerToolbar>
					<MessageToolbarActions />
					<MessageComposerToolbarSubmit>
						<MessageComposerAction aria-label='Send' icon='send' disabled={false} secondary={true} info={true} />
					</MessageComposerToolbarSubmit>
				</MessageComposerToolbar>
			</MessageComposer>
		</>
	),
};

export const WithHiddenPlaceholder: StoryObj<typeof RichTextComposerInput> = {
	render: () => (
		<>
			<MessageComposerHint icon='flask' helperText=''>
				Experiment: Real Time Composer
			</MessageComposerHint>
			<MessageComposer>
				<RichTextComposerInput placeholder='Type a message...' hideplaceholder={true} />
				<MessageComposerToolbar>
					<MessageToolbarActions />
					<MessageComposerToolbarSubmit>
						<MessageComposerAction aria-label='Send' icon='send' disabled={false} secondary={true} info={true} />
					</MessageComposerToolbarSubmit>
				</MessageComposerToolbar>
			</MessageComposer>
		</>
	),
};
