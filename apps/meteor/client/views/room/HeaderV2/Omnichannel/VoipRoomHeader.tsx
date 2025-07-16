import type { IVoipRoom } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { HeaderToolbar } from '../../../../components/Header';
import { parseOutboundPhoneNumber } from '../../../../lib/voip/parseOutboundPhoneNumber';
import type { RoomHeaderProps } from '../RoomHeader';
import RoomHeader from '../RoomHeader';
import BackButton from './BackButton';

type VoipRoomHeaderProps = {
	room: IVoipRoom;
} & Omit<RoomHeaderProps, 'room'>;

const VoipRoomHeader = ({ room }: VoipRoomHeaderProps) => {
	const router = useRouter();

	const currentRouteName = useSyncExternalStore(
		router.subscribeToRouteChange,
		useCallback(() => router.getRouteName(), [router]),
	);

	const slots = useMemo(
		() => ({
			start: currentRouteName === 'omnichannel-directory' && (
				<HeaderToolbar>{currentRouteName === 'omnichannel-directory' && <BackButton />}</HeaderToolbar>
			),
		}),
		[currentRouteName],
	);
	return <RoomHeader slots={slots} room={{ ...room, name: parseOutboundPhoneNumber(room.fname) }} />;
};

export default VoipRoomHeader;
