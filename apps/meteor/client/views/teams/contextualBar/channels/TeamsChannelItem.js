import { ActionButton, Box, Icon, Option, Tag } from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import RoomAvatar from '../../../../components/avatar/RoomAvatar';
import { usePermission } from '../../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { usePreventProgation } from '../../../../hooks/usePreventProgation';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import RoomActions from './RoomActions';

const TeamsChannelItem = ({ room, onClickView, reload }) => {
	const t = useTranslation();
	const rid = room._id;
	const type = room.t;

	const [showButton, setShowButton] = useState();

	const canRemoveTeamChannel = usePermission('remove-team-channel', rid);
	const canEditTeamChannel = usePermission('edit-team-channel', rid);
	const canDeleteTeamChannel = usePermission(type === 'c' ? 'delete-c' : 'delete-p', rid);

	const isReduceMotionEnabled = usePrefersReducedMotion();
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setShowButton,
	};

	const onClick = usePreventProgation();

	return (
		<Option id={room._id} data-rid={room._id} {...handleMenuEvent} onClick={onClickView}>
			<Option.Avatar>
				<RoomAvatar room={room} size='x28' />
			</Option.Avatar>
			<Option.Column>{room.t === 'c' ? <Icon name='hash' size='x15' /> : <Icon name='hashtag-lock' size='x15' />}</Option.Column>
			<Option.Content>
				<Box display='inline-flex' alignItems='center'>
					{roomCoordinator.getRoomName(room.t, room)}{' '}
					{room.teamDefault ? (
						<Box mi='x4'>
							<Tag>{t('Team_Auto-join')}</Tag>
						</Box>
					) : (
						''
					)}
				</Box>
			</Option.Content>
			{(canRemoveTeamChannel || canEditTeamChannel || canDeleteTeamChannel) && (
				<Option.Menu onClick={onClick}>
					{showButton ? <RoomActions room={room} reload={reload} /> : <ActionButton ghost tiny icon='kebab' />}
				</Option.Menu>
			)}
		</Option>
	);
};

export default Object.assign(TeamsChannelItem, {
	Skeleton: Option.Skeleton,
});
