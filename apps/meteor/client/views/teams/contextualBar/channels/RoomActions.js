import { Box, CheckBox, Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, usePermission, useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { useEndpointAction } from '../../../../hooks/useEndpointAction';
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

const RoomActions = ({ room, mainRoom, reload }) => {
	const t = useTranslation();
	const rid = room._id;
	const type = room.t;

	const dispatchToastMessage = useToastMessageDispatch();

	const canDeleteTeamChannel = usePermission(type === 'c' ? 'delete-c' : 'delete-p', rid);
	const canEditTeamChannel = usePermission('edit-team-channel', rid);
	const canRemoveTeamChannel = usePermission('remove-team-channel', rid);

	const updateRoomEndpoint = useEndpointAction('POST', '/v1/teams.updateRoom');
	const removeRoomEndpoint = useEndpointAction('POST', '/v1/teams.removeRoom', { successMessage: t('Room_has_been_removed') });
	const deleteRoomEndpoint = useEndpointAction('POST', room.t === 'c' ? '/v1/channels.delete' : '/v1/groups.delete', {
		successMessage: t('Room_has_been_deleted'),
	});

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
				<Box is='span' size='14px' color='status-font-on-danger' fontWeight='600'>
					{t('Team_Delete_Channel_modal_content_danger')}
				</Box>
				<Box is='span' size='14px'>
					{' '}
					{t('Team_Delete_Channel_modal_content')}
				</Box>
			</>
		),
	});

	const maxNumberOfAutoJoinMembers = useSetting('API_User_Limit');

	const menuOptions = useMemo(() => {
		const AutoJoinAction = async () => {
			try {
				const { room: updatedRoom } = await updateRoomEndpoint({
					roomId: rid,
					isDefault: !room.teamDefault,
				});

				if (updatedRoom.teamDefault) {
					// If the number of members in the mainRoom (the team) is greater than the limit, show an info message
					// informing that not all members will be auto-joined to the channel
					const messageType = mainRoom.usersCount > maxNumberOfAutoJoinMembers ? 'info' : 'success';
					const message =
						mainRoom.usersCount > maxNumberOfAutoJoinMembers ? 'Team_Auto-join_exceeded_user_limit' : 'Team_Auto-join_updated';

					dispatchToastMessage({
						type: messageType,
						message: t(message, {
							channelName: roomCoordinator.getRoomName(room.t, room),
							numberOfMembers: updatedRoom.usersCount,
							limit: maxNumberOfAutoJoinMembers,
						}),
					});
				}
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
		canEditTeamChannel,
		t,
		type,
		canRemoveTeamChannel,
		RemoveFromTeamAction,
		canDeleteTeamChannel,
		DeleteChannelAction,
		reload,
		updateRoomEndpoint,
		rid,
		room,
		mainRoom.usersCount,
		maxNumberOfAutoJoinMembers,
		dispatchToastMessage,
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
					<Box color='status-font-on-danger'>
						<Option {...props} label={label} icon={icon} />
					</Box>
				)
			}
			options={(canEditTeamChannel || canRemoveTeamChannel || canDeleteTeamChannel) && menuOptions}
		/>
	);
};

export default RoomActions;
