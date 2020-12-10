import React from 'react';

import { InviteUsers } from './InviteUsers';
import VerticalBar from '../../../../../components/VerticalBar';

export default {
	title: 'components/RoomMembers/InviteUsers',
	component: InviteUsers,
};

export const Default = () => <VerticalBar>
	<InviteUsers
		linkText='https://go.rocket.chat/invite?host=open.rocket.chat&path=invite%2F5sBs3a`'
		captionText='Expire on February 4, 2020 4:45 PM.'
		onClickBack={alert}
		onClickClose={alert}
		onClickEdit={alert}
	/>
</VerticalBar>;
