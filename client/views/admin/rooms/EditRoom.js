import {
	Box,
	Button,
	ButtonGroup,
	TextInput,
	Field,
	ToggleSwitch,
	Icon,
	Callout,
	TextAreaInput,
} from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, useMemo } from 'react';

import { roomTypes, RoomSettingsEnum } from '../../../../app/utils/client';
import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';
import RoomAvatarEditor from '../../../components/avatar/RoomAvatarEditor';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useSetModal } from '../../../contexts/ModalContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../../hooks/useEndpointAction';
import { useForm } from '../../../hooks/useForm';

const getInitialValues = (room) => ({
	roomName:
		room.t === 'd'
			? room.usernames.join(' x ')
			: roomTypes.getRoomName(room.t, { type: room.t, ...room }),
	roomType: room.t,
	readOnly: !!room.ro,
	archived: !!room.archived,
	isDefault: !!room.default,
	favorite: !!room.favorite,
	featured: !!room.featured,
	roomTopic: room.topic ?? '',
	roomDescription: room.description ?? '',
	roomAnnouncement: room.announcement ?? '',
	roomAvatar: undefined,
});

function EditRoom({ room, onChange }) {
	const t = useTranslation();

	const [deleted, setDeleted] = useState(false);

	const setModal = useSetModal();

	const { values, handlers, hasUnsavedChanges, reset } = useForm(getInitialValues(room));

	const [
		canViewName,
		canViewTopic,
		canViewAnnouncement,
		canViewArchived,
		canViewDescription,
		canViewType,
		canViewReadOnly,
	] = useMemo(() => {
		const isAllowed = roomTypes.getConfig(room.t).allowRoomSettingChange;
		return [
			isAllowed(room, RoomSettingsEnum.NAME),
			isAllowed(room, RoomSettingsEnum.TOPIC),
			isAllowed(room, RoomSettingsEnum.ANNOUNCEMENT),
			isAllowed(room, RoomSettingsEnum.ARCHIVE_OR_UNARCHIVE),
			isAllowed(room, RoomSettingsEnum.DESCRIPTION),
			isAllowed(room, RoomSettingsEnum.TYPE),
			isAllowed(room, RoomSettingsEnum.READ_ONLY),
		];
	}, [room]);

	const {
		roomName,
		roomType,
		readOnly,
		archived,
		isDefault,
		favorite,
		featured,
		roomTopic,
		roomAvatar,
		roomDescription,
		roomAnnouncement,
	} = values;

	const {
		handleIsDefault,
		handleFavorite,
		handleFeatured,
		handleRoomName,
		handleRoomType,
		handleReadOnly,
		handleArchived,
		handleRoomAvatar,
		handleRoomTopic,
		handleRoomDescription,
		handleRoomAnnouncement,
	} = handlers;

	const changeArchivation = archived !== !!room.archived;

	const canDelete = usePermission(`delete-${room.t}`);

	const archiveSelector = room.archived ? 'unarchive' : 'archive';
	const archiveMessage = room.archived ? 'Room_has_been_unarchived' : 'Room_has_been_archived';

	const saveAction = useEndpointActionExperimental(
		'POST',
		'rooms.saveRoomSettings',
		t('Room_updated_successfully'),
	);
	const archiveAction = useEndpointActionExperimental(
		'POST',
		'rooms.changeArchivationState',
		t(archiveMessage),
	);

	const handleSave = useMutableCallback(async () => {
		const save = () =>
			saveAction({
				rid: room._id,
				roomName: roomType === 'd' ? undefined : roomName,
				roomTopic,
				roomType,
				readOnly,
				default: isDefault,
				favorite: { defaultValue: isDefault, favorite },
				featured,
				roomDescription,
				roomAnnouncement,
				roomAvatar,
			});

		const archive = () => archiveAction({ rid: room._id, action: archiveSelector });

		await Promise.all(
			[hasUnsavedChanges && save(), changeArchivation && archive()].filter(Boolean),
		);
		onChange();
	});

	const changeRoomType = useMutableCallback(() => {
		handleRoomType(roomType === 'p' ? 'c' : 'p');
	});

	const deleteRoom = useMethod('eraseRoom');

	const handleDelete = useMutableCallback(() => {
		const onCancel = () => setModal(undefined);
		const onConfirm = async () => {
			await deleteRoom(room._id);
			onCancel();
			setDeleted(true);
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onConfirm}
				onCancel={onCancel}
				confirmText={t('Yes_delete_it')}
			>
				{t('Delete_Room_Warning')}
			</GenericModal>,
		);
	});

	return (
		<VerticalBar.ScrollableContent
			is='form'
			onSubmit={useMutableCallback((e) => e.preventDefault())}
		>
			{deleted && <Callout type='danger' title={t('Room_has_been_deleted')}></Callout>}
			{room.t !== 'd' && (
				<Box pbe='x24' display='flex' justifyContent='center'>
					<RoomAvatarEditor roomAvatar={roomAvatar} room={room} onChangeAvatar={handleRoomAvatar} />
				</Box>
			)}
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput
						disabled={deleted || !canViewName}
						value={roomName}
						onChange={handleRoomName}
						flexGrow={1}
					/>
				</Field.Row>
			</Field>
			{room.t !== 'd' && (
				<>
					<Field>
						<Field.Label>{t('Owner')}</Field.Label>
						<Field.Row>
							<Box fontScale='p1'>{room.u?.username}</Box>
						</Field.Row>
					</Field>
					{canViewDescription && (
						<Field>
							<Field.Label>{t('Description')}</Field.Label>
							<Field.Row>
								<TextAreaInput
									rows={4}
									disabled={deleted}
									value={roomDescription}
									onChange={handleRoomDescription}
									flexGrow={1}
								/>
							</Field.Row>
						</Field>
					)}
					{canViewAnnouncement && (
						<Field>
							<Field.Label>{t('Announcement')}</Field.Label>
							<Field.Row>
								<TextAreaInput
									rows={4}
									disabled={deleted}
									value={roomAnnouncement}
									onChange={handleRoomAnnouncement}
									flexGrow={1}
								/>
							</Field.Row>
						</Field>
					)}
					{canViewTopic && (
						<Field>
							<Field.Label>{t('Topic')}</Field.Label>
							<Field.Row>
								<TextAreaInput
									rows={4}
									disabled={deleted}
									value={roomTopic}
									onChange={handleRoomTopic}
									flexGrow={1}
								/>
							</Field.Row>
						</Field>
					)}
					{canViewType && (
						<Field>
							<Field.Row>
								<Field.Label>{t('Private')}</Field.Label>
								<ToggleSwitch
									disabled={deleted}
									checked={roomType === 'p'}
									onChange={changeRoomType}
								/>
							</Field.Row>
							<Field.Hint>{t('Just_invited_people_can_access_this_channel')}</Field.Hint>
						</Field>
					)}
					{canViewReadOnly && (
						<Field>
							<Field.Row>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<Field.Label>{t('Read_only')}</Field.Label>
									<ToggleSwitch disabled={deleted} checked={readOnly} onChange={handleReadOnly} />
								</Box>
							</Field.Row>
							<Field.Hint>{t('Only_authorized_users_can_write_new_messages')}</Field.Hint>
						</Field>
					)}
					{canViewArchived && (
						<Field>
							<Field.Row>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<Field.Label>{t('Room_archivation_state_true')}</Field.Label>
									<ToggleSwitch disabled={deleted} checked={archived} onChange={handleArchived} />
								</Box>
							</Field.Row>
						</Field>
					)}
				</>
			)}
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Default')}</Field.Label>
						<ToggleSwitch disabled={deleted} checked={isDefault} onChange={handleIsDefault} />
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Favorite')}</Field.Label>
						<ToggleSwitch disabled={deleted} checked={favorite} onChange={handleFavorite} />
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Featured')}</Field.Label>
						<ToggleSwitch disabled={deleted} checked={featured} onChange={handleFeatured} />
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<ButtonGroup stretch flexGrow={1}>
							<Button type='reset' disabled={!hasUnsavedChanges || deleted} onClick={reset}>
								{t('Reset')}
							</Button>
							<Button flexGrow={1} disabled={!hasUnsavedChanges || deleted} onClick={handleSave}>
								{t('Save')}
							</Button>
						</ButtonGroup>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Button
						primary
						flexGrow={1}
						danger
						disabled={deleted || !canDelete}
						onClick={handleDelete}
					>
						<Icon name='trash' size='x16' />
						{t('Delete')}
					</Button>
				</Field.Row>
			</Field>
		</VerticalBar.ScrollableContent>
	);
}

export default EditRoom;
