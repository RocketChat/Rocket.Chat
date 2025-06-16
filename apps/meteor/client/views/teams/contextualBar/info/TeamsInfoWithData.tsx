import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import TeamsInfo from './TeamsInfo';
import { useRoom } from '../../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../../room/contexts/RoomToolboxContext';
import EditChannelWithData from '../../../room/contextualBar/Info/EditRoomInfo';

const TeamsInfoWithData = () => {
	const room = useRoom();
	const [editing, setEditing] = useState(false);
	const { openTab, closeTab } = useRoomToolbox();

	const canEdit = usePermission('edit-team-channel', room._id);
	const onClickBack = useEffectEvent(() => setEditing(false));
	const onClickViewChannels = useCallback(() => openTab('team-channels'), [openTab]);

	if (editing) {
		return <EditChannelWithData onClickBack={onClickBack} />;
	}

	return (
		<TeamsInfo
			room={room}
			onClickEdit={canEdit ? () => setEditing(true) : undefined}
			onClickClose={closeTab}
			onClickViewChannels={onClickViewChannels}
		/>
	);
};

export default TeamsInfoWithData;
