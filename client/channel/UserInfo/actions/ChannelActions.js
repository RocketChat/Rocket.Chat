import React from 'react';
import { Box, ButtonGroup } from '@rocket.chat/fuselage';

import ActionSpread from '../../../components/basic/ActionSpread';
import { useRoomActions } from './useRoomActions';

const UserInfoActions = ({ user, onChange, ...props }) => {
	const menuOptions = useRoomActions(user);

	console.log(menuOptions);

	return <Box display='flex' flexDirection='row' {...props}>
		<ButtonGroup flexGrow={1} justifyContent='center'>
			<ActionSpread actions={menuOptions}/>
		</ButtonGroup>
	</Box>;
};

export default UserInfoActions;
