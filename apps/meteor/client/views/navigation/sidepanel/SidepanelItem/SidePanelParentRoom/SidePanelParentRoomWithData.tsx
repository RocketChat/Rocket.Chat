import { useUserSubscription } from '@rocket.chat/ui-contexts';

import SidePanelParentRoom from './SidePanelParentRoom';

export type SidePanelParentRoomWithDataProps = { prid: string };

const SidePanelParentRoomWithData = ({ prid }: SidePanelParentRoomWithDataProps) => {
	const subscription = useUserSubscription(prid);

	if (!subscription) {
		return null;
	}

	return <SidePanelParentRoom subscription={subscription} />;
};

export default SidePanelParentRoomWithData;
