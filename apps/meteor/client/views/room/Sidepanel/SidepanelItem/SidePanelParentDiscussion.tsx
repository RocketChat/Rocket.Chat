import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import SidePanelTag from './SidePanelTag';
import SidePanelTagIcon from './SidePanelTagIcon';
import { useParentDiscussionData } from './useParentDiscussionData';

const SidePanelParentDiscussion = ({ room }: { room: SubscriptionWithRoom }) => {
	const { prid } = room;

	if (!prid) {
		throw new Error('Parent room ID is missing');
	}

	const { handleRedirect, icon, roomName } = useParentDiscussionData(room);

	return (
		<SidePanelTag
			onKeyDown={(e) => (e.code === 'Space' || e.code === 'Enter') && handleRedirect()}
			onClick={(e) => {
				e.preventDefault();
				handleRedirect();
			}}
		>
			{icon && <SidePanelTagIcon icon={{ name: icon }} />}
			{roomName}
		</SidePanelTag>
	);
};

export default SidePanelParentDiscussion;
