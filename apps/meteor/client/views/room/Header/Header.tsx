import type { IRoom } from '@rocket.chat/core-typings';
import { isVoipRoom } from '@rocket.chat/core-typings';
import { HeaderToolbar } from '@rocket.chat/ui-client';
import { useLayout, useSetting, useUser } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { lazy, memo, useMemo } from 'react';

import { RoomRoles } from '../../../../app/models/client';
import BurgerMenu from '../../../components/BurgerMenu';
import { useReactiveQuery } from '../../../hooks/useReactiveQuery';

const DirectRoomHeader = lazy(() => import('./DirectRoomHeader'));
const OmnichannelRoomHeader = lazy(() => import('./Omnichannel/OmnichannelRoomHeader'));
const VoipRoomHeader = lazy(() => import('./Omnichannel/VoipRoomHeader'));
const RoomHeader = lazy(() => import('./RoomHeader'));

type HeaderProps<T> = {
	room: T;
};

const Header = ({ room }: HeaderProps<IRoom>): ReactElement | null => {
	const { isMobile, isEmbedded, showTopNavbarEmbeddedLayout } = useLayout();
	const useRealName = useSetting('UI_Use_Real_Name') as boolean;
	const user = useUser();

	const { data: roomLeader } = useReactiveQuery(['rooms', room._id, 'leader', { not: user?._id }], () => {
		const leaderRoomRole = RoomRoles.findOne({
			'rid': room._id,
			'roles': 'leader',
			'u._id': { $ne: user?._id },
		});

		if (!leaderRoomRole) {
			return null;
		}

		return {
			...leaderRoomRole.u,
			name: useRealName ? leaderRoomRole.u.name || leaderRoomRole.u.username : leaderRoomRole.u.username,
		};
	});

	const slots = useMemo(
		() => ({
			start: isMobile && (
				<HeaderToolbar>
					<BurgerMenu />
				</HeaderToolbar>
			),
		}),
		[isMobile],
	);

	if (isEmbedded && !showTopNavbarEmbeddedLayout) {
		return null;
	}

	if (room.t === 'd' && (room.uids?.length ?? 0) < 3) {
		return <DirectRoomHeader slots={slots} room={room} />;
	}

	if (room.t === 'l') {
		return <OmnichannelRoomHeader slots={slots} />;
	}

	if (isVoipRoom(room)) {
		return <VoipRoomHeader slots={slots} room={room} />;
	}

	return <RoomHeader slots={slots} room={room} topic={room.topic} roomLeader={roomLeader} />;
};

export default memo(Header);
