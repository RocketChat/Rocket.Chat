import type { IUser, IRoom } from '@rocket.chat/core-typings';
import type { MouseEvent, ReactElement } from 'react';
import { memo } from 'react';

import RoomMembersItem from './RoomMembersItem';

type RoomMembersRowProps = {
	user: Pick<IUser, 'federated' | 'username' | 'name' | '_id' | 'freeSwitchExtension'>;
	data: {
		onClickView: (e: MouseEvent<HTMLElement>) => void;
		rid: IRoom['_id'];
	};
	index: number;
	reload: () => void;
	useRealName: boolean;
};

const RoomMembersRow = ({ user, data: { onClickView, rid }, index, reload, useRealName }: RoomMembersRowProps): ReactElement => {
	if (!user?._id) {
		return <RoomMembersItem.Skeleton />;
	}

	return (
		<RoomMembersItem
			key={index}
			useRealName={useRealName}
			username={user.username}
			_id={user._id}
			rid={rid}
			name={user.name}
			federated={user.federated}
			freeSwitchExtension={user.freeSwitchExtension}
			onClickView={onClickView}
			reload={reload}
		/>
	);
};

export default memo(RoomMembersRow);
