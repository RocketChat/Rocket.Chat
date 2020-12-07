import React from 'react';

import { AddUsers } from './AddUsers';
import VerticalBar from '../../../../components/VerticalBar';

export default {
	title: 'components/RoomMembers/AddUsers',
	component: AddUsers,
};

export const Default = () => <VerticalBar>
	<AddUsers
		onClickBack={alert}
		onClickClose={alert}
	/>
</VerticalBar>;
