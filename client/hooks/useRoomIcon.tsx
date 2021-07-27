import React, { ReactNode } from 'react';

import { IRoom, IOmnichannelRoom, IDirectMessageRoom } from '../../definition/IRoom';
import { ReactiveUserStatus } from '../components/UserStatus';

export const colors = {
	busy: 'danger-500',
	away: 'warning-600',
	online: 'success-500',
	offline: 'neutral-600',
};

export const useRoomIcon = (room: IRoom): ReactNode | { name: string; color?: string } | null => {
	if (room.prid) {
		return { name: 'baloons' };
	}

	if (room.teamMain) {
		return { name: room.t === 'p' ? 'team-lock' : 'team' };
	}

	switch (room.t) {
		case 'p':
			return { name: 'hashtag-lock' };
		case 'c':
			return { name: 'hash' };
		case 'l':
			return {
				name: 'headset',
				color: colors[(room as unknown as IOmnichannelRoom)?.v.status || 'offline'],
			};
		case 'd':
			const direct = room as unknown as IDirectMessageRoom;
			if (direct.uids && direct.uids.length > 2) {
				return { name: 'balloon' };
			}
			if (direct.uids && direct.uids.length > 0) {
				return (
					<ReactiveUserStatus
						{...({
							uid: direct.uids.filter((uid) => uid !== room.u._id)[0] || room.u._id,
						} as any)}
					/>
				);
			}
			return { name: 'at' };
		default:
			return null;
	}
};
