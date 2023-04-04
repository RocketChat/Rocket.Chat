import type { IUser, IRoom } from '@rocket.chat/core-typings';
import type { MouseEvent, ReactElement } from 'react';
import React, { memo } from 'react';

import RoomMembersItem from './RoomMembersItem';

type RoomMembersRowProps = {
	user: Pick<IUser, 'federated' | 'username' | 'name' | '_id'>;
	data: {
		onClickView: (e: MouseEvent<HTMLElement>) => void;
		rid: IRoom['_id'];
	};
	index: number;
	reload: () => void;
};

const RoomMembersRow = ({ user, data: { onClickView, rid }, index, reload }: RoomMembersRowProps): ReactElement => {
	if (!user || !user._id) {
		return <RoomMembersItem.Skeleton />;
	}

	return (
		<RoomMembersItem
			key={index}
			username={user.username}
			_id={user._id}
			rid={rid}
			name={user.name}
			federated={user.federated}
			onClickView={onClickView}
			reload={reload}
		/>
	);
};

export default memo(RoomMembersRow);
