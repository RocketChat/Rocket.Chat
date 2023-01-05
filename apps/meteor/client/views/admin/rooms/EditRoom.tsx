import type { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, TextInput, Field, ToggleSwitch, Icon, TextAreaInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, usePermission, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState, useMemo } from 'react';

import { RoomSettingsEnum } from '../../../../definition/IRoomTypeConfig';
import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';
import RoomAvatarEditor from '../../../components/avatar/RoomAvatarEditor';
import { useEndpointActionExperimental } from '../../../hooks/useEndpointActionExperimental';
import { useForm } from '../../../hooks/useForm';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import DeleteTeamModalWithRooms from '../../teams/contextualBar/info/Delete';

type EditRoomProps = {
	room: Pick<IRoom, RoomAdminFieldsType>;
	onChange: () => void;
	onDelete: () => void;
};

type EditRoomFormValues = {
	roomName: IRoom['name'];
	roomTopic: string;
	roomType: IRoom['t'];
	readOnly: boolean;
	isDefault: boolean;
	favorite: boolean;
	featured: boolean;
	reactWhenReadOnly: boolean;
	roomDescription: string;
	roomAnnouncement: string;
	roomAvatar: IRoom['avatarETag'];
	archived: boolean;
};

const getInitialValues = (room: Pick<IRoom, RoomAdminFieldsType>): EditRoomFormValues => ({
	roomName: room.t === 'd' ? room.usernames?.join(' x ') : roomCoordinator.getRoomName(room.t, room),
	roomType: room.t,
	readOnly: !!room.ro,
	archived: !!room.archived,
	isDefault: !!room.default,
	favorite: !!room.favorite,
	featured: !!room.featured,
	reactWhenReadOnly: !!room.reactWhenReadOnly,
	roomTopic: room.topic ?? '',
	roomDescription: room.description ?? '',
	roomAnnouncement: room.announcement ?? '',
	roomAvatar: undefined,
});

const EditRoom = ({ room, onChange, onDelete }: EditRoomProps): ReactElement => {
	const t = useTranslation();

	const [deleting, setDeleting] = useState(false);

	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const { values, handlers, hasUnsavedChanges, reset } = useForm(getInitialValues(room));

	const [canViewName, canViewTopic, canViewAnnouncement, canViewArchived, canViewDescription, canViewType, canViewReadOnly] =
		useMemo(() => {
			const isAllowed = roomCoordinator.getRoomDirectives(room.t)?.allowRoomSettingChange;
			return [
				isAllowed?.(room, RoomSettingsEnum.NAME),
				isAllowed?.(room, RoomSettingsEnum.TOPIC),
				isAllowed?.(room, RoomSettingsEnum.ANNOUNCEMENT),
				isAllowed?.(room, RoomSettingsEnum.ARCHIVE_OR_UNARCHIVE),
				isAllowed?.(room, RoomSettingsEnum.DESCRIPTION),
				isAllowed?.(room, RoomSettingsEnum.TYPE),
				isAllowed?.(room, RoomSettingsEnum.READ_ONLY),
				isAllowed?.(room, RoomSettingsEnum.REACT_WHEN_READ_ONLY),
			];
		}, [room]);

	const {
		roomName,
		roomType,
		readOnly,
		reactWhenReadOnly,
		archived,
		isDefault,
		favorite,
		featured,
		roomTopic,
		roomAvatar,
		roomDescription,
		roomAnnouncement,
	} = values as EditRoomFormValues;

	const {
		handleIsDefault,
		handleFavorite,
		handleFeatured,
		handleRoomName,
		handleRoomType,
		handleReadOnly,
		handleReactWhenReadOnly,
		handleArchived,
		handleRoomAvatar,
		handleRoomTopic,
		handleRoomDescription,
		handleRoomAnnouncement,
	} = handlers;

	const changeArchivation = archived !== !!room.archived;

	const roomsRoute = useRoute('admin-rooms');

	const canDelete = usePermission(`delete-${room.t}`);

	const archiveSelector = room.archived ? 'unarchive' : 'archive';
	const archiveMessage = room.archived ? 'Room_has_been_unarchived' : 'Room_has_been_archived';

	const saveAction = useEndpointActionExperimental('POST', '/v1/rooms.saveRoomSettings', t('Room_updated_successfully'));
	const archiveAction = useEndpointActionExperimental('POST', '/v1/rooms.changeArchivationState', t(archiveMessage));

	const handleSave = useMutableCallback(async () => {
		const save = (): Promise<{ success: boolean; rid: string }> =>
			saveAction({
				rid: room._id,
				roomName: roomType === 'd' ? undefined : roomName,
				roomTopic,
				roomType,
				readOnly,
				default: isDefault,
				favorite: { defaultValue: isDefault, favorite },
				featured,
				reactWhenReadOnly,
				roomDescription,
				roomAnnouncement,
				roomAvatar,
			});

		const archive = (): Promise<{ success: boolean }> => archiveAction({ rid: room._id, action: archiveSelector });

		const promises = [];
		hasUnsavedChanges && promises.push(save());
		changeArchivation && promises.push(archive());
		await Promise.all(promises);
		onChange();
	});

	const changeRoomType = useMutableCallback(() => {
		handleRoomType(roomType === 'p' ? 'c' : 'p');
	});

	const deleteRoom = useEndpoint('POST', '/v1/rooms.delete');
	const deleteTeam = useEndpoint('POST', '/v1/teams.delete');

	const handleDelete = useMutableCallback(() => {
		if (room.teamMain) {
			setModal(
				<DeleteTeamModalWithRooms
					onConfirm={async (deletedRooms: IRoom[]): Promise<void> => {
						const roomsToRemove = Array.isArray(deletedRooms) && deletedRooms.length > 0 ? deletedRooms.map((room) => room._id) : [];

						try {
							setDeleting(true);
							setModal(null);
							await deleteTeam({ teamId: room.teamId as string, ...(roomsToRemove.length && { roomsToRemove }) });
							dispatchToastMessage({ type: 'success', message: t('Team_has_been_deleted') });
							roomsRoute.push({});
						} catch (error) {
							dispatchToastMessage({ type: 'error', message: error });
							setDeleting(false);
						} finally {
							onDelete();
						}
					}}
					onCancel={(): void => setModal(null)}
					teamId={room.teamId as string}
				/>,
			);

			return;
		}

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={async (): Promise<void> => {
					try {
						setDeleting(true);
						setModal(null);
						await deleteRoom({ roomId: room._id });
						dispatchToastMessage({ type: 'success', message: t('Room_has_been_deleted') });
						roomsRoute.push({});
					} catch (error) {
						dispatchToastMessage({ type: 'error', message: error });
						setDeleting(false);
					} finally {
						onDelete();
					}
				}}
				onClose={(): void => setModal(null)}
				onCancel={(): void => setModal(null)}
				confirmText={t('Yes_delete_it')}
			>
				{t('Delete_Room_Warning')}
			</GenericModal>,
		);
	});

	return (
		<VerticalBar.ScrollableContent is='form' onSubmit={useMutableCallback((e) => e.preventDefault())}>
			{room.t !== 'd' && (
				<Box pbe='x24' display='flex' justifyContent='center'>
					<RoomAvatarEditor roomAvatar={roomAvatar} room={room} onChangeAvatar={handleRoomAvatar} />
				</Box>
			)}
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput disabled={deleting || !canViewName} value={roomName} onChange={handleRoomName} flexGrow={1} />
				</Field.Row>
			</Field>
			{room.t !== 'd' && (
				<>
					{room.u && (
						<Field>
							<Field.Label>{t('Owner')}</Field.Label>
							<Field.Row>
								<Box fontScale='p2'>{room.u?.username}</Box>
							</Field.Row>
						</Field>
					)}
					{canViewDescription && (
						<Field>
							<Field.Label>{t('Description')}</Field.Label>
							<Field.Row>
								<TextAreaInput rows={4} disabled={deleting} value={roomDescription} onChange={handleRoomDescription} flexGrow={1} />
							</Field.Row>
						</Field>
					)}
					{canViewAnnouncement && (
						<Field>
							<Field.Label>{t('Announcement')}</Field.Label>
							<Field.Row>
								<TextAreaInput rows={4} disabled={deleting} value={roomAnnouncement} onChange={handleRoomAnnouncement} flexGrow={1} />
							</Field.Row>
						</Field>
					)}
					{canViewTopic && (
						<Field>
							<Field.Label>{t('Topic')}</Field.Label>
							<Field.Row>
								<TextAreaInput rows={4} disabled={deleting} value={roomTopic} onChange={handleRoomTopic} flexGrow={1} />
							</Field.Row>
						</Field>
					)}
					{canViewType && (
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
								<Field.Label>{t('Private')}</Field.Label>
								<Field.Row>
									<ToggleSwitch disabled={deleting} checked={roomType === 'p'} onChange={changeRoomType} />
								</Field.Row>
							</Box>
							<Field.Hint>{t('Just_invited_people_can_access_this_channel')}</Field.Hint>
						</Field>
					)}
					{canViewReadOnly && (
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
								<Field.Label>{t('Read_only')}</Field.Label>
								<Field.Row>
									<ToggleSwitch disabled={deleting} checked={readOnly} onChange={handleReadOnly} />
								</Field.Row>
							</Box>
							<Field.Hint>{t('Only_authorized_users_can_write_new_messages')}</Field.Hint>
						</Field>
					)}
					{readOnly && (
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
								<Field.Label>{t('React_when_read_only')}</Field.Label>
								<Field.Row>
									<ToggleSwitch checked={reactWhenReadOnly} onChange={handleReactWhenReadOnly} />
								</Field.Row>
							</Box>
							<Field.Hint>{t('React_when_read_only_changed_successfully')}</Field.Hint>
						</Field>
					)}
					{canViewArchived && (
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
								<Field.Label>{t('Room_archivation_state_true')}</Field.Label>
								<Field.Row>
									<ToggleSwitch disabled={deleting} checked={archived} onChange={handleArchived} />
								</Field.Row>
							</Box>
						</Field>
					)}
				</>
			)}
			<Field>
				<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
					<Field.Label>{t('Default')}</Field.Label>
					<Field.Row>
						<ToggleSwitch disabled={deleting} checked={isDefault} onChange={handleIsDefault} />
					</Field.Row>
				</Box>
			</Field>
			<Field>
				<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
					<Field.Label>{t('Favorite')}</Field.Label>
					<Field.Row>
						<ToggleSwitch disabled={deleting} checked={favorite} onChange={handleFavorite} />
					</Field.Row>
				</Box>
			</Field>
			<Field>
				<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
					<Field.Label>{t('Featured')}</Field.Label>
					<Field.Row>
						<ToggleSwitch disabled={deleting} checked={featured} onChange={handleFeatured} />
					</Field.Row>
				</Box>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<ButtonGroup stretch flexGrow={1}>
							<Button type='reset' disabled={!hasUnsavedChanges || deleting} onClick={reset}>
								{t('Reset')}
							</Button>
							<Button flexGrow={1} disabled={!hasUnsavedChanges || deleting} onClick={handleSave}>
								{t('Save')}
							</Button>
						</ButtonGroup>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Button flexGrow={1} danger disabled={deleting || !canDelete} onClick={handleDelete}>
						<Icon name='trash' size='x16' />
						{t('Delete')}
					</Button>
				</Field.Row>
			</Field>
		</VerticalBar.ScrollableContent>
	);
};

export default EditRoom;
