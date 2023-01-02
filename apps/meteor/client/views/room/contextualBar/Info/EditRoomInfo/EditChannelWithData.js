import { useUserRoom } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useTabBarClose } from '../../../contexts/ToolboxContext';
import EditChannel from './EditChannel';

function EditChannelWithData({ rid, onClickBack }) {
	const room = useUserRoom(rid);
	const onClickClose = useTabBarClose();

	return <EditChannel onClickClose={onClickClose} onClickBack={onClickBack} room={{ type: room?.t, ...room }} />;
}

export default EditChannelWithData;
