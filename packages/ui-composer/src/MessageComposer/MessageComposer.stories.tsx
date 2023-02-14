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
} from '.';

export default {
	title: 'Components/MessageComposer',
	component: MessageComposer,
} as ComponentMeta<typeof MessageComposer>;

export const messageComposer: ComponentStory<typeof MessageComposer> = () => (
	<MessageComposer>
		<MessageComposerInput placeholder='Text' />
		<MessageComposerToolbar>
			<MessageComposerToolbarActions>
				<MessageComposerAction icon='emoji' />
				<MessageComposerActionsDivider />
				<MessageComposerAction icon='bold' />
				<MessageComposerAction icon='italic' />
				<MessageComposerAction icon='underline' />
				<MessageComposerAction icon='strike' />
				<MessageComposerAction icon='code' />
				<MessageComposerAction icon='arrow-return' />
				<MessageComposerActionsDivider />
				<MessageComposerAction icon='mic' />
				<MessageComposerAction icon='clip' />
			</MessageComposerToolbarActions>
		</MessageComposerToolbar>
	</MessageComposer>
);

export const messageComposerWithSubmitActions: ComponentStory<typeof MessageComposer> = () => (
	<MessageComposer>
		<MessageComposerInput placeholder='Text' />
		<MessageComposerToolbar>
			<MessageComposerToolbarActions>
				<MessageComposerAction icon='emoji' />
				<MessageComposerActionsDivider />
				<MessageComposerAction icon='bold' />
				<MessageComposerAction icon='italic' />
				<MessageComposerAction icon='underline' />
				<MessageComposerAction icon='strike' />
				<MessageComposerAction icon='code' />
				<MessageComposerAction icon='arrow-return' />
				<MessageComposerActionsDivider />
				<MessageComposerAction icon='mic' />
				<MessageComposerAction icon='clip' />
			</MessageComposerToolbarActions>
			<MessageComposerToolbarSubmit>
				<Button small>Preview</Button>
				<Button primary small>
					Send
				</Button>
			</MessageComposerToolbarSubmit>
		</MessageComposerToolbar>
	</MessageComposer>
);

export const messageComposerLoading: ComponentStory<typeof MessageComposer> = () => <MessageComposerSkeleton />;
