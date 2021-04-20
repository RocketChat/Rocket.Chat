import React from 'react';

import Header from '../../../components/Header';
import { useRoomIcon } from '../../../hooks/useRoomIcon';

const HeaderIconWithRoom = ({ room }) => {
	const icon = useRoomIcon(room);

	return <Header.Tag.Icon icon={icon} />;
};
export default HeaderIconWithRoom;
