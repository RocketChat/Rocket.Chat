import { IUser, IRoom } from '@rocket.chat/core-typings';
import React, { memo, MouseEvent, ReactElement } from 'react';

import { MemberItem } from './components/MemberItem';

type DefaultRowProps = {
	user: Pick<IUser, 'federated' | 'username' | 'name' | '_id'>;
	data: {
		onClickView: (e: MouseEvent<HTMLDivElement>) => void;
		rid: IRoom['_id'];
	};
	index: number;
	reload: () => void;
};

const DefaultRow = ({ user, data, index, reload }: DefaultRowProps): ReactElement => {
	const { onClickView, rid } = data;

	if (!user || !user._id) {
		return <MemberItem.Skeleton />;
	}

	return (
		<MemberItem
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

export default memo(DefaultRow);
