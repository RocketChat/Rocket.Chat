import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { HeaderToolbar } from '../../../../components/Header';
import { useOmnichannelRoom } from '../../contexts/RoomContext';
import RoomHeader from '../RoomHeader';
import BackButton from './BackButton';
import OmnichannelRoomHeaderTag from './OmnichannelRoomHeaderTag';
import QuickActions from './QuickActions';

const OmnichannelRoomHeader = () => {
	const router = useRouter();

	const currentRouteName = useSyncExternalStore(
		router.subscribeToRouteChange,
		useCallback(() => router.getRouteName(), [router]),
	);

	const room = useOmnichannelRoom();

	const slots = useMemo(
		() => ({
			start: (currentRouteName === 'omnichannel-directory' || currentRouteName === 'omnichannel-current-chats') && (
				<HeaderToolbar>
					<BackButton routeName={currentRouteName} />
				</HeaderToolbar>
			),
			insideContent: <OmnichannelRoomHeaderTag />,
			posContent: <QuickActions />,
		}),
		[currentRouteName],
	);

	return <RoomHeader slots={slots} room={room} />;
};

export default OmnichannelRoomHeader;
