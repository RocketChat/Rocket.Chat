import { Button, IconButton } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import '@rocket.chat/icons/dist/rocketchat.css';
import {
	MessageComposer,
	MessageComposerAction,
	MessageComposerToolbarActions,
	MessageComposerInput,
	RichTextComposerInput,
	MessageComposerToolbar,
	MessageComposerActionsDivider,
	MessageComposerToolbarSubmit,
	MessageComposerSkeleton,
	MessageComposerHint,
	MessageComposerInputExpandable,
	MessageComposerFile,
	MessageComposerFileGroup,
	MessageComposerFileError,
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

export const Expandable: StoryFn<typeof MessageComposer> = () => (
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

export const ToolbarActions: StoryFn<typeof MessageComposerToolbarActions> = () => <MessageToolbarActions />;
export const _MessageComposerNew: StoryFn<typeof MessageComposer> = (args) => (
	<MessageComposer>
		<MessageComposerInput placeholder={args.placeholder || 'Placeholder text'} />
		<RichTextComposerInput placeholder='RealTimeEditor' />
		<MessageComposerToolbar>
			<MessageToolbarActions />
			<MessageComposerToolbarSubmit>
				<MessageComposerAction aria-label='Send' icon='send' disabled={false} secondary={true} info={true} />
			</MessageComposerToolbarSubmit>
		</MessageComposerToolbar>
	</MessageComposer>
);

export const RichTextComposer: StoryFn<typeof MessageComposer> = (args) => (
	<>
		<MessageComposerHint icon='flask' helperText=''>
			Experiment: Real Time Composer
		</MessageComposerHint>
		<MessageComposer>
			<RichTextComposerInput placeholder={args.placeholder || 'Placeholder text'} hidePlaceholder={args.hidePlaceholder} />
			<MessageComposerToolbar>
				<MessageToolbarActions />
				<MessageComposerToolbarSubmit>
					<MessageComposerAction aria-label='Send' icon='send' disabled={false} secondary={true} info={true} />
				</MessageComposerToolbarSubmit>
			</MessageComposerToolbar>
		</MessageComposer>
	</>
);

RichTextComposer.args = {
	// Define the props (args) you want to control
	placeholder: 'Type a message...',
	hidePlaceholder: false,
};

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

export const WithFiles: StoryFn<typeof MessageComposer> = () => (
	<MessageComposer>
		<MessageComposerInput placeholder='Text' />
		<MessageComposerFileGroup>
			<MessageComposerFile
				fileTitle='antique-pocket-clock-500x500.zip'
				fileSubtitle='58.33 KB - application/zip'
				fileFormat='zip'
				actionIcon={<IconButton aria-label='Close' icon='cross' mini />}
				onClick={action('click')}
			/>
			<MessageComposerFile
				disabled
				fileTitle='file.png'
				fileSubtitle='2 MB'
				fileFormat='png'
				actionIcon={<IconButton aria-label='Close' icon='cross' mini />}
				onClick={action('click')}
			/>
			<MessageComposerFileError
				fileTitle='file.png'
				fileFormat='png'
				error={new Error('Something went wrong')}
				actionIcon={<IconButton aria-label='Close' icon='cross' mini />}
				onClick={action('click')}
			/>
		</MessageComposerFileGroup>
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
export const MessageComposerLoading: StoryFn<typeof MessageComposer> = () => <MessageComposerSkeleton />;
