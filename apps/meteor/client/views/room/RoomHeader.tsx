import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { FeaturePreview, FeaturePreviewOn, FeaturePreviewOff } from '@rocket.chat/ui-client';

import HeaderV1 from './Header';
import { HeaderV2 } from './HeaderV2';

type RoomHeaderProps = {
	room: IRoom;
	subscription?: ISubscription;
};

const RoomHeader = ({ room, subscription }: RoomHeaderProps) => {
	return (
		<FeaturePreview feature='newNavigation'>
			<FeaturePreviewOn>
				<HeaderV2 room={room} subscription={subscription} />
			</FeaturePreviewOn>
			<FeaturePreviewOff>
				<HeaderV1 room={room} subscription={subscription} />
			</FeaturePreviewOff>
		</FeaturePreview>
	);
};

export default RoomHeader;
