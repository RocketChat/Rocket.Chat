import { useUserSubscription } from '@rocket.chat/ui-contexts';

import SidePanelParentRoom from './SidePanelParentRoom';

const SidePanelParentRoomWithData = ({ prid }: { prid: string }) => {
	const subscription = useUserSubscription(prid);

	if (!subscription) {
		return null;
	}

	return <SidePanelParentRoom subscription={subscription} />;
};

export default SidePanelParentRoomWithData;
