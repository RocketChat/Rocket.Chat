import { Box, CheckBox, Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { useEndpointActionExperimental } from '../../../../hooks/useEndpointActionExperimental';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import ConfirmationModal from './ConfirmationModal';

const useReactModal = (Component, props) => {
	const setModal = useSetModal();

	return useMutableCallback(() => {
		const handleClose = () => {
			setModal(null);
		};

		setModal(() => <Component onClose={handleClose} {...props} />);
	});
};

const RoomActions = ({ room, reload }) => {
	const t = useTranslation();
	const rid = room._id;
	const type = room.t;

	const dispatchToastMessage = useToastMessageDispatch();

	const canDeleteTeamChannel = usePermission(type === 'c' ? 'delete-c' : 'delete-p', rid);
	const canEditTeamChannel = usePermission('edit-team-channel', rid);
	const canRemoveTeamChannel = usePermission('remove-team-channel', rid);

	const updateRoomEndpoint = useEndpointActionExperimental('POST', 'teams.updateRoom');
	const removeRoomEndpoint = useEndpointActionExperimental('POST', 'teams.removeRoom', t('Room_has_been_removed'));
	const deleteRoomEndpoint = useEndpointActionExperimental(
		'POST',
		room.t === 'c' ? 'channels.delete' : 'groups.delete',
		t('Room_has_been_deleted'),
	);

	const RemoveFromTeamAction = useReactModal(ConfirmationModal, {
		onConfirmAction: async () => {
			try {
				await removeRoomEndpoint({ teamId: room.teamId, roomId: room._id });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			reload();
		},
		labelButton: t('Remove'),
		content: (
			<Box is='span' size='14px'>
				{t('Team_Remove_from_team_modal_content', {
					teamName: roomCoordinator.getRoomName(room.t, room),
				})}
			</Box>
		),
	});

	const DeleteChannelAction = useReactModal(ConfirmationModal, {
		onConfirmAction: async () => {
			try {
				await deleteRoomEndpoint({ roomId: room._id });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			reload();
		},
		labelButton: t('Delete'),
		content: (
			<>
				<Box is='span' size='14px' color='danger-500' fontWeight='600'>
					{t('Team_Delete_Channel_modal_content_danger')}
				</Box>
				<Box is='span' size='14px'>
					{' '}
					{t('Team_Delete_Channel_modal_content')}
				</Box>
			</>
		),
	});

	const menuOptions = useMemo(() => {
		const AutoJoinAction = async () => {
			try {
				await updateRoomEndpoint({
					roomId: rid,
					isDefault: !room.teamDefault,
				});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}

			reload();
		};

		return [
			canEditTeamChannel && {
				label: {
					label: t('Team_Auto-join'),
					icon: type === 'c' ? 'hash' : 'hashtag-lock',
				},
				action: AutoJoinAction,
			},
			canRemoveTeamChannel && {
				label: {
					label: t('Team_Remove_from_team'),
					icon: 'cross',
				},
				action: RemoveFromTeamAction,
			},
			canDeleteTeamChannel && {
				label: {
					label: t('Delete'),
					icon: 'trash',
				},
				action: DeleteChannelAction,
			},
		].filter(Boolean);
	}, [
		DeleteChannelAction,
		RemoveFromTeamAction,
		rid,
		type,
		room.teamDefault,
		t,
		updateRoomEndpoint,
		reload,
		dispatchToastMessage,
		canDeleteTeamChannel,
		canRemoveTeamChannel,
		canEditTeamChannel,
	]);

	return (
		<Menu
			flexShrink={0}
			key='menu'
			tiny
			renderItem={({ label: { label, icon }, ...props }) =>
				icon.match(/hash/) ? (
					<Option {...props} label={label} icon={icon}>
						<CheckBox checked={room.teamDefault} />
					</Option>
				) : (
					<Box color='danger-600'>
						<Option {...props} label={label} icon={icon} />
					</Box>
				)
			}
			options={(canEditTeamChannel || canRemoveTeamChannel || canDeleteTeamChannel) && menuOptions}
		/>
	);
};

export default RoomActions;
