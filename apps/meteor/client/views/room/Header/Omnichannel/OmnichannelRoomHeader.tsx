import { HeaderToolbar } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { useOmnichannelRoom } from '../../contexts/RoomContext';
import RoomHeader from '../RoomHeader';
import BackButton from './BackButton';
import OmnichannelRoomHeaderTag from './OmnichannelRoomHeaderTag';
import QuickActions from './QuickActions';

const OmnichannelRoomHeader = () => {
	const router = useRouter();

	const previousRouteName = useSyncExternalStore(
		router.subscribeToRouteChange,
		useCallback(() => router.getPreviousRouteName(), [router]),
	);

	const room = useOmnichannelRoom();

	const slots = useMemo(
		() => ({
			start: (previousRouteName === 'omnichannel-directory' || previousRouteName === 'omnichannel-current-chats') && (
				<HeaderToolbar>
					<BackButton routeName={previousRouteName} />
				</HeaderToolbar>
			),
			insideContent: <OmnichannelRoomHeaderTag />,
			posContent: <QuickActions />,
		}),
		[previousRouteName],
	);

	return <RoomHeader slots={slots} room={room} />;
};

export default OmnichannelRoomHeader;
