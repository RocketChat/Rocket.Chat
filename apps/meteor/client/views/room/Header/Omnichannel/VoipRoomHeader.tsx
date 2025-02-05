import type { IVoipRoom } from '@rocket.chat/core-typings';
import { useLayout, useRouter } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { HeaderToolbar } from '../../../../components/Header';
import SidebarToggler from '../../../../components/SidebarToggler';
import { parseOutboundPhoneNumber } from '../../../../lib/voip/parseOutboundPhoneNumber';
import type { RoomHeaderProps } from '../RoomHeader';
import RoomHeader from '../RoomHeader';
import { BackButton } from './BackButton';

type VoipRoomHeaderProps = {
	room: IVoipRoom;
} & Omit<RoomHeaderProps, 'room'>;

const VoipRoomHeader = ({ slots: parentSlot, room }: VoipRoomHeaderProps) => {
	const router = useRouter();

	const currentRouteName = useSyncExternalStore(
		router.subscribeToRouteChange,
		useCallback(() => router.getRouteName(), [router]),
	);

	const { isMobile } = useLayout();

	const slots = useMemo(
		() => ({
			...parentSlot,
			start: (!!isMobile || currentRouteName === 'omnichannel-directory') && (
				<HeaderToolbar>
					{isMobile && <SidebarToggler />}
					{currentRouteName === 'omnichannel-directory' && <BackButton />}
				</HeaderToolbar>
			),
		}),
		[isMobile, currentRouteName, parentSlot],
	);
	return <RoomHeader slots={slots} room={{ ...room, name: parseOutboundPhoneNumber(room.fname) }} />;
};

export default VoipRoomHeader;
