import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRoomToolbox, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

import TeamsInfo from './TeamsInfo';
import { useRoom } from '../../../room/contexts/RoomContext';
import EditChannelWithData from '../../../room/contextualBar/Info/EditRoomInfo';

const TeamsInfoWithData = () => {
	const room = useRoom();
	const { openTab, closeTab } = useRoomToolbox();

	const canEdit = usePermission('edit-team-channel', room._id);
	// `context=edit` in the route opens the panel straight on the edit form, as the Teams panel's "Edit info" does.
	const startEditing = useRouteParameter('context') === 'edit' && canEdit;
	const [editing, setEditing] = useState(startEditing);

	useEffect(() => {
		if (startEditing) {
			setEditing(true);
		}
	}, [startEditing]);
	const onClickBack = useStableCallback(() => setEditing(false));
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
