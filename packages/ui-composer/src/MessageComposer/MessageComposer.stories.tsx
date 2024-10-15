import { Button } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

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
} as ComponentMeta<typeof MessageComposer>;

const _MessageToolbarActions: ComponentStory<typeof MessageComposerToolbarActions> = () => (
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

export const _MessageComposer: ComponentStory<typeof MessageComposer> = () => (
	<MessageComposer>
		<MessageComposerInput placeholder='Text' />
		<MessageComposerToolbar>
			<_MessageToolbarActions />
		</MessageComposerToolbar>
	</MessageComposer>
);

export const MessageComposerWithHints: ComponentStory<typeof MessageComposer> = () => (
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
				<_MessageToolbarActions />
				<MessageComposerToolbarSubmit>
					<MessageComposerAction aria-label='Send' icon='send' disabled={false} secondary={true} info={true} />
				</MessageComposerToolbarSubmit>
			</MessageComposerToolbar>
		</MessageComposer>
	</>
);

export const MessageComposerWithSubmitActions: ComponentStory<typeof MessageComposer> = () => (
	<MessageComposer>
		<MessageComposerInput placeholder='Text' />
		<MessageComposerToolbar>
			<_MessageToolbarActions />
			<MessageComposerToolbarSubmit>
				<Button small>Preview</Button>
				<Button primary small>
					Send
				</Button>
			</MessageComposerToolbarSubmit>
		</MessageComposerToolbar>
	</MessageComposer>
);

export const MessageComposerLoading: ComponentStory<typeof MessageComposer> = () => <MessageComposerSkeleton />;
