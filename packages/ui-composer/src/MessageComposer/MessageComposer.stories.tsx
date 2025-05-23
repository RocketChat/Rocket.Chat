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
		<MessageComposerAction title='emoji' icon='emoji' />
		<MessageComposerActionsDivider />
		<MessageComposerAction title='bold' icon='bold' />
		<MessageComposerAction title='italic' icon='italic' />
		<MessageComposerAction title='underline' icon='underline' />
		<MessageComposerAction title='strike' icon='strike' />
		<MessageComposerAction title='code' icon='code' />
		<MessageComposerAction title='multiline' icon='multiline' />
		<MessageComposerAction title='link' icon='link' />
		<MessageComposerAction title='katex' icon='katex' />
		<MessageComposerActionsDivider />
		<MessageComposerAction title='mic' icon='mic' />
		<MessageComposerAction title='video' icon='video' />
		<MessageComposerAction title='attachment' icon='clip' />
		<MessageComposerAction title='more' icon='plus' />
	</MessageComposerToolbarActions>
);

export const Default: StoryFn<typeof MessageComposer> = () => (
	<MessageComposer>
		<MessageComposerInput placeholder='Text' />
		<MessageComposerToolbar>
			<MessageToolbarActions />
		</MessageComposerToolbar>
	</MessageComposer>
);

export const ToolbarActions: StoryFn<typeof MessageComposerToolbarActions> = () => <MessageToolbarActions />;

export const WithHints: StoryFn<typeof MessageComposer> = () => (
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
			<MessageComposerInput placeholder='Text' />
			<MessageComposerToolbar>
				<MessageToolbarActions />
				<MessageComposerToolbarSubmit>
					<MessageComposerAction aria-label='Send' icon='send' disabled={false} secondary={true} info={true} />
				</MessageComposerToolbarSubmit>
			</MessageComposerToolbar>
		</MessageComposer>
	</>
);

export const WithSubmit: StoryFn<typeof MessageComposer> = () => (
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

export const Loading: StoryFn<typeof MessageComposer> = () => <MessageComposerSkeleton />;
