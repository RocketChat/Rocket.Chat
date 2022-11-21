import { Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import {
	MessageComposer,
	MessageComposerActionsDivider,
	MessageComposerToolbar,
	MessageComposerToolbarActions,
	MessageComposerToolbarSubmit,
} from '.';

const MessageComposerSkeleton = (): ReactElement => (
	<MessageComposer>
		<Skeleton p='x4' m='x8' />
		<MessageComposerToolbar>
			<MessageComposerToolbarActions>
				<Skeleton p='x4' pi='x6' />
				<Skeleton p='x4' pi='x6' />
				<MessageComposerActionsDivider />
				<Skeleton p='x4' pi='x6' />
				<Skeleton p='x4' pi='x6' />
			</MessageComposerToolbarActions>
			<MessageComposerToolbarSubmit>
				<Skeleton p='x4' width={60} />
				<Skeleton p='x4' width={60} />
			</MessageComposerToolbarSubmit>
		</MessageComposerToolbar>
	</MessageComposer>
);

export default MessageComposerSkeleton;
