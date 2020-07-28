import React, { useCallback } from 'react';
import { Box, Button, Margins, TextInput, Field, ToggleSwitch, Icon, Callout, TextAreaInput } from '@rocket.chat/fuselage';

import { useTranslation } from '../contexts/TranslationContext';
import RoomAvatarEditor from './basic/avatar/RoomAvatarEditor';

const EditRoomForm = ({ values, handlers, onSave, onDelete, canDelete, onReset, deleted, room, hasUnsavedChanges, append }) => {
	const t = useTranslation();

	const {
		roomName,
		roomType,
		readOnly,
		archived,
		roomTopic,
		roomDescription,
		roomAnnouncement,
	} = values;

	const {
		handleRoomName,
		handleRoomType,
		handleReadOnly,
		handleArchived,
		handleRoomAvatar,
		handleRoomTopic,
		handleRoomDescription,
		handleRoomAnnouncement,
	} = handlers;

	const changeRoomType = useCallback(() => {
		handleRoomType(roomType === 'p' ? 'c' : 'p');
	}, [handleRoomType, roomType]);

	return <>
		{deleted && <Callout type='danger' title={t('Room_has_been_deleted')}></Callout>}
		{room.t !== 'd' && <RoomAvatarEditor room={room} onChangeAvatar={handleRoomAvatar}/>}
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput disabled={deleted || room.t === 'd'} value={roomName} onChange={handleRoomName} flexGrow={1}/>
			</Field.Row>
		</Field>
		{ room.t !== 'd' && <>
			<Field>
				<Field.Label>{t('Owner')}</Field.Label>
				<Field.Row>
					<Box fontScale='p1'>{room.u?.username}</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Description')}</Field.Label>
				<Field.Row>
					<TextAreaInput rows={4} disabled={deleted} value={roomDescription} onChange={handleRoomDescription} flexGrow={1}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Announcement')}</Field.Label>
				<Field.Row>
					<TextAreaInput rows={4} disabled={deleted} value={roomAnnouncement} onChange={handleRoomAnnouncement} flexGrow={1}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Topic')}</Field.Label>
				<Field.Row>
					<TextAreaInput rows={4} disabled={deleted} value={roomTopic} onChange={handleRoomTopic} flexGrow={1}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Field.Label>{t('Private')}</Field.Label>
					<ToggleSwitch disabled={deleted} checked={roomType === 'p'} onChange={changeRoomType}/>
				</Field.Row>
				<Field.Hint>{t('Just_invited_people_can_access_this_channel')}</Field.Hint>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Read_only')}</Field.Label>
						<ToggleSwitch disabled={deleted} checked={readOnly} onChange={handleReadOnly}/>
					</Box>
				</Field.Row>
				<Field.Hint>{t('Only_authorized_users_can_write_new_messages')}</Field.Hint>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Archived')}</Field.Label>
						<ToggleSwitch disabled={deleted} checked={archived} onChange={handleArchived}/>
					</Box>
				</Field.Row>
			</Field>
			{ append }
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<Margins inlineEnd='x4'>
							<Button flexGrow={1} type='reset' disabled={!hasUnsavedChanges || deleted} onClick={onReset}>{t('Reset')}</Button>
							<Button mie='none' flexGrow={1} disabled={!hasUnsavedChanges || deleted} onClick={onSave}>{t('Save')}</Button>
						</Margins>
					</Box>
				</Field.Row>
			</Field>
		</>}
		<Field>
			<Field.Row>
				<Button primary danger disabled={deleted || !canDelete} onClick={onDelete} display='flex' alignItems='center' justifyContent='center' flexGrow={1}><Icon name='trash' size='x16' />{t('Delete')}</Button>
			</Field.Row>
		</Field>
	</>;
};

export default EditRoomForm;
