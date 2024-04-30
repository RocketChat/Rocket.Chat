import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { RoomBanner, RoomBannerContent } from '@rocket.chat/ui-client';
import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import React from 'react';

import { RoomRoles } from '../../../../app/models/client';
import MarkdownText from '../../../components/MarkdownText';
import { usePresence } from '../../../hooks/usePresence';
import { useReactiveQuery } from '../../../hooks/useReactiveQuery';
import { RoomLeader } from '../Header/RoomLeader';

type RoomHeaderSectionProps = {
	room: IRoom;
	user: IUser | null;
};

export const RoomHeaderSection = ({ room, user }: RoomHeaderSectionProps) => {
	const userId = useUserId();
	const directUserId = room.uids?.filter((uid) => uid !== userId).shift();
	const directUserData = usePresence(directUserId);
	const useRealName = useSetting('UI_Use_Real_Name') as boolean;

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

	const topic = room.t === 'd' && (room.uids?.length ?? 0) < 3 ? directUserData?.statusText : room.topic;

	if (!topic && !roomLeader) return null;

	return (
		<RoomBanner className='rcx-header-section'>
			<RoomBannerContent>
				<MarkdownText parseEmoji={true} variant='inlineWithoutBreaks' withTruncatedText content={topic} />
			</RoomBannerContent>
			{roomLeader && <RoomLeader {...roomLeader} />}
		</RoomBanner>
	);
};
