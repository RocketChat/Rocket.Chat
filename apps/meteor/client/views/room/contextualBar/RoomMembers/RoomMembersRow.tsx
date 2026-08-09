import type { IRoom } from '@rocket.chat/core-typings';
import type { ComponentProps, MouseEvent } from 'react';
import { memo } from 'react';

import RoomMembersItem from './RoomMembersItem';
import type { RoomMember } from '../../../hooks/useMembersList';

type RoomMembersRowProps = {
	user: Pick<RoomMember, 'federated' | 'username' | 'name' | '_id' | 'freeSwitchExtension' | 'subscription'>;
	data: {
		onClickView: (e: MouseEvent<HTMLElement>) => void;
		rid: IRoom['_id'];
	};
	index: number;
	reload: () => void;
	useRealName: boolean;
} & Pick<ComponentProps<typeof RoomMembersItem>, 'is' | 'role'>;

const RoomMembersRow = ({ user, data: { onClickView, rid }, index, reload, useRealName, is, role }: RoomMembersRowProps) => {
	if (!user?._id) {
		return <RoomMembersItem.Skeleton />;
	}

	return (
		<RoomMembersItem
			is={is}
			role={role}
			key={index}
			useRealName={useRealName}
			username={user.username}
			_id={user._id}
			rid={rid}
			name={user.name}
			federated={user.federated}
			freeSwitchExtension={user.freeSwitchExtension}
			subscription={user.subscription}
			onClickView={onClickView}
			reload={reload}
		/>
	);
};

export default memo(RoomMembersRow);
