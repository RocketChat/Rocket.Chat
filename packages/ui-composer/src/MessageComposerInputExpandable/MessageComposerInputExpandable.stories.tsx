import { Button } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import '@rocket.chat/icons/dist/rocketchat.css';
import {
	MessageComposer,
	MessageComposerAction,
	MessageComposerToolbarActions,
	MessageComposerToolbar,
	MessageComposerActionsDivider,
	MessageComposerToolbarSubmit,
	MessageComposerSkeleton,
	MessageComposerHint,
} from '../MessageComposer';
import MessageComposerInputExpandable from './MessageComposerInputExpandable';

export default {
	title: 'Components/MessageComposerInputExpandable',
	component: MessageComposerInputExpandable,
} satisfies Meta<typeof MessageComposerInputExpandable>;

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

export const Default: StoryFn<typeof MessageComposerInputExpandable> = () => (
	<MessageComposer>
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 120,
			}}
			placeholder='Type a message...'
		/>
		<MessageComposerToolbar>
			<MessageToolbarActions />
		</MessageComposerToolbar>
	</MessageComposer>
);

export const SmallSize: StoryFn<typeof MessageComposerInputExpandable> = () => (
	<MessageComposer>
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 300,
				blockSize: 80,
			}}
			placeholder='Type a message...'
		/>
		<MessageComposerToolbar>
			<MessageToolbarActions />
		</MessageComposerToolbar>
	</MessageComposer>
);

export const LargeSize: StoryFn<typeof MessageComposerInputExpandable> = () => (
	<MessageComposer>
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 600,
				blockSize: 150,
			}}
			placeholder='Type a message...'
		/>
		<MessageComposerToolbar>
			<MessageToolbarActions />
		</MessageComposerToolbar>
	</MessageComposer>
);

export const WithText: StoryFn<typeof MessageComposerInputExpandable> = () => (
	<MessageComposer>
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 120,
			}}
			placeholder='Type a message...'
			value='This is some sample text to demonstrate the expandable input with content.'
		/>
		<MessageComposerToolbar>
			<MessageToolbarActions />
		</MessageComposerToolbar>
	</MessageComposer>
);

export const BelowThreshold: StoryFn<typeof MessageComposerInputExpandable> = () => (
	<MessageComposer>
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 80, // Below the 100px threshold for showing expand button
			}}
			placeholder='Type a message...'
		/>
		<MessageComposerToolbar>
			<MessageToolbarActions />
		</MessageComposerToolbar>
	</MessageComposer>
);

export const WithHints: StoryFn<typeof MessageComposerInputExpandable> = () => (
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
			<MessageComposerInputExpandable
				dimensions={{
					inlineSize: 400,
					blockSize: 120,
				}}
				placeholder='Type a message...'
			/>
			<MessageComposerToolbar>
				<MessageToolbarActions />
				<MessageComposerToolbarSubmit>
					<MessageComposerAction aria-label='Send' icon='send' disabled={false} secondary={true} info={true} />
				</MessageComposerToolbarSubmit>
			</MessageComposerToolbar>
		</MessageComposer>
	</>
);

export const WithSubmit: StoryFn<typeof MessageComposerInputExpandable> = () => (
	<MessageComposer>
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 120,
			}}
			placeholder='Type a message...'
		/>
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

export const Loading: StoryFn<typeof MessageComposerInputExpandable> = () => <MessageComposerSkeleton />;
