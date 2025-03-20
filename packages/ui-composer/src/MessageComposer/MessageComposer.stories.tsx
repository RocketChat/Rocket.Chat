import { Button } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import '@rocket.chat/icons/dist/rocketchat.css';
import {
	MessageComposer,
	MessageComposerAction,
	MessageComposerToolbarActions,
	MessageComposerInput,
	MessageComposerToolbar,
	MessageComposerActionsDivider,
	MessageComposerToolbarSubmit,
	MessageComposerSkeleton,
	MessageComposerHint,
} from '.';

export default {
	title: 'Components/MessageComposer',
	component: MessageComposer,
} satisfies Meta<typeof MessageComposer>;

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

export const MessageToolberActions: StoryFn<typeof MessageComposerToolbarActions> = () => <MessageToolbarActions />;

export const _MessageComposer: StoryFn<typeof MessageComposer> = () => (
	<MessageComposer>
		<MessageComposerInput placeholder='Text' />
		<MessageComposerToolbar>
			<MessageToolbarActions />
		</MessageComposerToolbar>
	</MessageComposer>
);

export const MessageComposerWithHints: StoryFn<typeof MessageComposer> = () => (
	<>
		<MessageComposerHint
			icon='pencil'
			helperText={
				<>
					<strong>esc</strong> to cancel · <strong>enter</strong> to save
				</>
			}
		>
			Editing message
		</MessageComposerHint>
		<MessageComposer>
			<MessageComposerInput placeholder='Text' value='Lorem ipsum dolor' />
			<MessageComposerToolbar>
				<MessageToolbarActions />
				<MessageComposerToolbarSubmit>
					<MessageComposerAction aria-label='Send' icon='send' disabled={false} secondary={true} info={true} />
				</MessageComposerToolbarSubmit>
			</MessageComposerToolbar>
		</MessageComposer>
	</>
);

export const MessageComposerWithSubmitActions: StoryFn<typeof MessageComposer> = () => (
	<MessageComposer>
		<MessageComposerInput placeholder='Text' />
		<MessageComposerToolbar>
			<MessageToolbarActions />
			<MessageComposerToolbarSubmit>
				<Button small>Preview</Button>
				<Button primary small>
					Send
				</Button>
			</MessageComposerToolbarSubmit>
		</MessageComposerToolbar>
	</MessageComposer>
);

export const MessageComposerLoading: StoryFn<typeof MessageComposer> = () => <MessageComposerSkeleton />;
