import React from 'react';

import { RoomMembers } from './List/RoomMembers';
import VerticalBar from '../../../../components/VerticalBar';

export default {
	title: 'views/room/contextualBar/RoomMembers',
	component: RoomMembers,
};

export const _RoomMembers = () => <VerticalBar>
	<RoomMembers
		onClickBack={alert}
		onClickClose={alert}
		onClickSave={alert}
		value={[]}
		errors={{}}
		type='all'
	/>
</VerticalBar>;
_RoomMembers.storyName = 'RoomMembers';
