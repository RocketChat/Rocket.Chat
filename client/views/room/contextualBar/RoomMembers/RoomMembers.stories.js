import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import RoomMembers from './List/RoomMembers';

export default {
	title: 'room/contextualBar/RoomMembers',
	component: RoomMembers,
};

export const Default = () => (
	<VerticalBar>
		<RoomMembers onClickBack={alert} onClickClose={alert} onClickSave={alert} value={[]} errors={{}} type='all' />
	</VerticalBar>
);
