import type { IRoom } from '@rocket.chat/core-typings';
import { useUserRoom } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useTabBarClose } from '../../../contexts/ToolboxContext';
import EditRoomInfo from './EditRoomInfo';

type EditRoomInfoWithDataProps = {
	rid: IRoom['_id'];
	onClickBack: () => void;
};

const EditRoomInfoWithData = ({ rid, onClickBack }: EditRoomInfoWithDataProps) => {
	const room = useUserRoom(rid);
	const onClickClose = useTabBarClose();

	if (!room) {
		throw new Error('Room was not provided');
	}

	return <EditRoomInfo onClickClose={onClickClose} onClickBack={onClickBack} room={room} />;
};

export default EditRoomInfoWithData;
