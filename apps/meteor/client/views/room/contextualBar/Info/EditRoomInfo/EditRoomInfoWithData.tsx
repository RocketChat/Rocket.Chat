import type { IRoom } from '@rocket.chat/core-typings';
import React from 'react';

import { useRoom } from '../../../contexts/RoomContext';
import { useRoomToolbox } from '../../../contexts/RoomToolboxContext';
import EditRoomInfo from './EditRoomInfo';

type EditRoomInfoWithDataProps = {
	rid: IRoom['_id'];
	onClickBack: () => void;
};

const EditRoomInfoWithData = ({ onClickBack }: EditRoomInfoWithDataProps) => {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();

	return <EditRoomInfo onClickClose={closeTab} onClickBack={onClickBack} room={room} />;
};

export default EditRoomInfoWithData;
