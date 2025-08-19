import type { IRoom } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';

import RoomMembersWithData from '../../room/contextualBar/RoomMembers/RoomMembersWithData';

type AdminRoomMembersProps = {
	rid: IRoom['_id'];
	onClose?: () => void;
};

const AdminRoomMembers = ({ rid }: AdminRoomMembersProps): ReactElement => {
	return <RoomMembersWithData rid={rid} adminView />;
};

export default AdminRoomMembers;
