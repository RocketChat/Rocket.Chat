import type { IVoipRoom } from '@rocket.chat/core-typings';
import { HeaderToolbar } from '@rocket.chat/ui-client';
import { useLayout, useRouter } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { parseOutboundPhoneNumber } from '../../../../../ee/client/lib/voip/parseOutboundPhoneNumber';
import BurgerMenu from '../../../../components/BurgerMenu';
import type { RoomHeaderProps } from '../RoomHeader';
import RoomHeader from '../RoomHeader';
import { BackButton } from './BackButton';

type VoipRoomHeaderProps = {
	room: IVoipRoom;
} & Omit<RoomHeaderProps, 'room'>;

const VoipRoomHeader: FC<VoipRoomHeaderProps> = ({ slots: parentSlot, room }) => {
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
					{isMobile && <BurgerMenu />}
					{currentRouteName === 'omnichannel-directory' && <BackButton />}
				</HeaderToolbar>
			),
		}),
		[isMobile, currentRouteName, parentSlot],
	);
	return <RoomHeader slots={slots} room={{ ...room, name: parseOutboundPhoneNumber(room.fname) }} />;
};

export default VoipRoomHeader;
