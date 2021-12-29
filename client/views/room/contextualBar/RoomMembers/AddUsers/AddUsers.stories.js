import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import AddUsers from './AddUsers';

export default {
	title: 'room/contextualBar/RoomMembers/AddUsers',
	component: AddUsers,
};

export const Default = () => (
	<VerticalBar>
		<AddUsers onClickBack={alert} onClickClose={alert} onClickSave={alert} value={[]} errors={{}} />
	</VerticalBar>
);

export const Error = () => (
	<VerticalBar>
		<AddUsers onClickBack={alert} onClickClose={alert} onClickSave={alert} value={[]} errors={{ users: 'With Test Error' }} />
	</VerticalBar>
);
