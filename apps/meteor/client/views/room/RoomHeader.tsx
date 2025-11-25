import type { IRoom } from '@rocket.chat/core-typings';
import { FeaturePreview, FeaturePreviewOn, FeaturePreviewOff } from '@rocket.chat/ui-client';

import HeaderV1 from './Header';
import { HeaderV2 } from './HeaderV2';

type RoomHeaderProps = {
	room: IRoom;
};

const RoomHeader = ({ room }: RoomHeaderProps) => {
	return (
		<FeaturePreview feature='newNavigation'>
			<FeaturePreviewOn>
				<HeaderV2 room={room} />
			</FeaturePreviewOn>
			<FeaturePreviewOff>
				<HeaderV1 room={room} />
			</FeaturePreviewOff>
		</FeaturePreview>
	);
};

export default RoomHeader;
