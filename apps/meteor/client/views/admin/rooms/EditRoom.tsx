import type { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import {
	Box,
	Button,
	ButtonGroup,
	TextInput,
	Field,
	FieldLabel,
	FieldRow,
	FieldHint,
	ToggleSwitch,
	TextAreaInput,
} from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { RoomSettingsEnum } from '../../../../definition/IRoomTypeConfig';
import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../components/Contextualbar';
import RoomAvatarEditor from '../../../components/avatar/RoomAvatarEditor';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useForm } from '../../../hooks/useForm';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { useDeleteRoom } from '../../hooks/roomActions/useDeleteRoom';

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

	const { values, handlers, hasUnsavedChanges, reset } = useForm(getInitialValues(room));

	const [canViewName, canViewTopic, canViewAnnouncement, canViewArchived, canViewDescription, canViewType, canViewReadOnly] =
		useMemo(() => {
			const isAllowed = roomCoordinator.getRoomDirectives(room.t).allowRoomSettingChange;
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

	const { handleDelete, canDeleteRoom, isDeleting } = useDeleteRoom(room, { reload: onDelete });

	const archiveSelector = room.archived ? 'unarchive' : 'archive';
	const archiveMessage = room.archived ? 'Room_has_been_unarchived' : 'Room_has_been_archived';

	const saveAction = useEndpointAction('POST', '/v1/rooms.saveRoomSettings', {
		successMessage: t('Room_updated_successfully'),
	});
	const archiveAction = useEndpointAction('POST', '/v1/rooms.changeArchivationState', { successMessage: t(archiveMessage) });

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

	return (
		<>
			<ContextualbarScrollableContent is='form' onSubmit={useMutableCallback((e) => e.preventDefault())}>
				{room.t !== 'd' && (
					<Box pbe={24} display='flex' justifyContent='center'>
						<RoomAvatarEditor disabled={isRoomFederated(room)} roomAvatar={roomAvatar} room={room} onChangeAvatar={handleRoomAvatar} />
					</Box>
				)}
				<Field>
					<FieldLabel required>{t('Name')}</FieldLabel>
					<FieldRow>
						<TextInput disabled={isDeleting || !canViewName} value={roomName} onChange={handleRoomName} flexGrow={1} />
					</FieldRow>
				</Field>
				{room.t !== 'd' && (
					<>
						{room.u && (
							<Field>
								<FieldLabel>{t('Owner')}</FieldLabel>
								<FieldRow>
									<Box fontScale='p2'>{room.u?.username}</Box>
								</FieldRow>
							</Field>
						)}
						{canViewDescription && (
							<Field>
								<FieldLabel>{t('Description')}</FieldLabel>
								<FieldRow>
									<TextAreaInput
										rows={4}
										disabled={isDeleting || isRoomFederated(room)}
										value={roomDescription}
										onChange={handleRoomDescription}
										flexGrow={1}
									/>
								</FieldRow>
							</Field>
						)}
						{canViewAnnouncement && (
							<Field>
								<FieldLabel>{t('Announcement')}</FieldLabel>
								<FieldRow>
									<TextAreaInput
										rows={4}
										disabled={isDeleting || isRoomFederated(room)}
										value={roomAnnouncement}
										onChange={handleRoomAnnouncement}
										flexGrow={1}
									/>
								</FieldRow>
							</Field>
						)}
						{canViewTopic && (
							<Field>
								<FieldLabel>{t('Topic')}</FieldLabel>
								<FieldRow>
									<TextAreaInput rows={4} disabled={isDeleting} value={roomTopic} onChange={handleRoomTopic} flexGrow={1} />
								</FieldRow>
							</Field>
						)}
						{canViewType && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<FieldLabel>{t('Private')}</FieldLabel>
									<FieldRow>
										<ToggleSwitch disabled={isDeleting || isRoomFederated(room)} checked={roomType === 'p'} onChange={changeRoomType} />
									</FieldRow>
								</Box>
								<FieldHint>{t('Just_invited_people_can_access_this_channel')}</FieldHint>
							</Field>
						)}
						{canViewReadOnly && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<FieldLabel>{t('Read_only')}</FieldLabel>
									<FieldRow>
										<ToggleSwitch disabled={isDeleting || isRoomFederated(room)} checked={readOnly} onChange={handleReadOnly} />
									</FieldRow>
								</Box>
								<FieldHint>{t('Only_authorized_users_can_write_new_messages')}</FieldHint>
							</Field>
						)}
						{readOnly && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<FieldLabel>{t('React_when_read_only')}</FieldLabel>
									<FieldRow>
										<ToggleSwitch checked={reactWhenReadOnly || isRoomFederated(room)} onChange={handleReactWhenReadOnly} />
									</FieldRow>
								</Box>
								<FieldHint>{t('React_when_read_only_changed_successfully')}</FieldHint>
							</Field>
						)}
						{canViewArchived && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<FieldLabel>{t('Room_archivation_state_true')}</FieldLabel>
									<FieldRow>
										<ToggleSwitch disabled={isDeleting || isRoomFederated(room)} checked={archived} onChange={handleArchived} />
									</FieldRow>
								</Box>
							</Field>
						)}
					</>
				)}
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<FieldLabel>{t('Default')}</FieldLabel>
						<FieldRow>
							<ToggleSwitch disabled={isDeleting || isRoomFederated(room)} checked={isDefault} onChange={handleIsDefault} />
						</FieldRow>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<FieldLabel>{t('Favorite')}</FieldLabel>
						<FieldRow>
							<ToggleSwitch disabled={isDeleting} checked={favorite} onChange={handleFavorite} />
						</FieldRow>
					</Box>
				</Field>
				<Field>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<FieldLabel>{t('Featured')}</FieldLabel>
						<FieldRow>
							<ToggleSwitch disabled={isDeleting || isRoomFederated(room)} checked={featured} onChange={handleFeatured} />
						</FieldRow>
					</Box>
				</Field>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button type='reset' disabled={!hasUnsavedChanges || isDeleting} onClick={reset}>
						{t('Reset')}
					</Button>
					<Button disabled={!hasUnsavedChanges || isDeleting} onClick={handleSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
				<ButtonGroup mbs={8} stretch>
					<Button icon='trash' danger loading={isDeleting} disabled={!canDeleteRoom || isRoomFederated(room)} onClick={handleDelete}>
						{t('Delete')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default EditRoom;
