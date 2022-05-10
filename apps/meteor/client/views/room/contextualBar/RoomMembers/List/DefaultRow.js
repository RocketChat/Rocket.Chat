import React, { memo } from 'react';

import { MemberItem } from './components/MemberItem';

const DefaultRow = ({ user, data, index, reload }) => {
	const { onClickView, rid } = data;

	if (!user) {
		return <MemberItem.Skeleton />;
	}

	return (
		<MemberItem
			index={index}
			username={user.username}
			_id={user._id}
			rid={rid}
			status={user.status}
			name={user.name}
			onClickView={onClickView}
			reload={reload}
		/>
	);
};

export default memo(DefaultRow);
