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
		<Skeleton p={4} m={8} />
		<MessageComposerToolbar>
			<MessageComposerToolbarActions>
				<Skeleton p={4} pi={6} />
				<Skeleton p={4} pi={6} />
				<MessageComposerActionsDivider />
				<Skeleton p={4} pi={6} />
				<Skeleton p={4} pi={6} />
			</MessageComposerToolbarActions>
			<MessageComposerToolbarSubmit>
				<Skeleton p={4} width={60} />
				<Skeleton p={4} width={60} />
			</MessageComposerToolbarSubmit>
		</MessageComposerToolbar>
	</MessageComposer>
);

export default MessageComposerSkeleton;
