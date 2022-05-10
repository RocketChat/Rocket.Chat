import { Box, Sidebar, Dropdown } from '@rocket.chat/fuselage';
import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import React, { useRef } from 'react';
import { createPortal } from 'react-dom';

import { useDropdownVisibility } from '../hooks/useDropdownVisibility';
import CreateRoomList from './CreateRoomList';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

const CreateRoom = (props) => {
	const reference = useRef(null);
	const target = useRef(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);

	return (
		<>
			{showCreate && (
				<Box ref={reference}>
					<Sidebar.TopBar.Action {...props} icon='edit-rounded' onClick={toggle} />
				</Box>
			)}
			{isVisible &&
				createPortal(
					<Dropdown reference={reference} ref={target}>
						<CreateRoomList closeList={() => toggle(false)} />
					</Dropdown>,
					document.body,
				)}
		</>
	);
};

export default CreateRoom;
