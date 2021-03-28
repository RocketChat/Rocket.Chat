import React from 'react';

import Breadcrumbs from '../../../components/Breadcrumbs';
import { useRoomIcon } from '../../../hooks/useRoomIcon';

const HeaderIcon = ({ room }) => {
	const icon = useRoomIcon(room);

	return <Breadcrumbs.Icon name={icon.name}>{!icon.name && icon}</Breadcrumbs.Icon>;
};

export default HeaderIcon;
