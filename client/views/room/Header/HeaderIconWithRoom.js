import React from 'react';

import Header from '../../../components/Header';
import { useRoomIcon } from '../../../hooks/useRoomIcon';

const HeaderIconWithRoom = ({ room }) => {
	const icon = useRoomIcon(room);

	return <Header.Icon icon={icon} />;
};
export default HeaderIconWithRoom;
