import React, { useCallback, useState, useMemo } from 'react';
import { Box, Button, Margins, TextInput, Skeleton, Field, ToggleSwitch, Divider, Icon, Callout, RadioButton	 } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { roomTypes } from '../../../app/utils/client';
import { useMethod } from '../../contexts/ServerContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import VerticalBar from '../../components/basic/VerticalBar';

export function EditRoomContextBar({ rid }) {
	const canViewRoomAdministration = usePermission('view-room-administration');
	return canViewRoomAdministration ? <EditRoomWithData rid={rid}/> : <NotAuthorizedPage/>;
}

function EditRoomWithData({ rid }) {
	const [cache, setState] = useState();

	// TODO: remove cache. Is necessary for data invalidation
	const { data = {}, state, error } = useEndpointDataExperimental('rooms.adminRooms.getRoom', useMemo(() => ({ rid }), [rid, cache]));

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box w='full' pb='x24'>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (state === ENDPOINT_STATES.ERROR) {
		return error.message;
	}

	return <EditRoom room={data} onChange={() => setState(new Date())}/>;
}

function EditRoom({ room, onChange }) {
	const t = useTranslation();

	const [deleted, setDeleted] = useState(false);
	const [newData, setNewData] = useState({});
	const [changeArchivation, setChangeArchivation] = useState(false);

	const canDelete = usePermission(`delete-${ room.t }`);

	const hasUnsavedChanges = useMemo(() => Object.values(newData).filter((current) => current === null).length < Object.keys(newData).length, [newData]);
	const saveQuery = useMemo(() => ({ rid: room._id, ...Object.fromEntries(Object.entries(newData).filter(([, value]) => value !== null)) }), [room._id, newData]);

	const archiveSelector = room.archived ? 'unarchive' : 'archive';
	const archiveMessage = archiveSelector === 'archive' ? 'Room_has_been_archived' : 'Room_has_been_archived';
	const archiveQuery = useMemo(() => ({ rid: room._id, action: room.archived ? 'unarchive' : 'archive' }), [room._id, room.archived]);

	const saveAction = useEndpointAction('POST', 'rooms.saveRoomSettings', saveQuery, t('Room_updated_successfully'));
	const archiveAction = useEndpointAction('POST', 'rooms.changeArchivationState', archiveQuery, t(archiveMessage));

	const updateType = (type) => () => (type === 'p' ? 'c' : 'p');
	const areEqual = (a, b) => a === b || !(a || b);

	const handleChange = (field, currentValue, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: areEqual(getValue(e), currentValue) ? null : getValue(e) });
	const handleSave = async () => {
		await Promise.all([hasUnsavedChanges && saveAction(), changeArchivation && archiveAction()].filter(Boolean));
		onChange('update');
	};

	const deleteRoom = useMethod('eraseRoom');

	const handleDelete = useCallback(async () => {
		await deleteRoom(room._id);
		setDeleted(true);
	}, [deleteRoom, room._id]);

	const roomName = room.t === 'd' ? room.usernames.join(' x ') : roomTypes.getRoomName(room.t, { type: room.t, ...room });
	const roomType = newData.roomType ?? room.t;
	const readOnly = newData.readOnly ?? !!room.ro;
	const isArchived = changeArchivation ? !room.archived : !!room.archived;
	const isDefault = newData.default ?? !!room.default;
	const isFavorite = newData.favorite ?? !!room.favorite;
	const isFeatured = newData.featured ?? !!room.featured;

	return <VerticalBar.ScrollableContent is='form' onSubmit={useCallback((e) => e.preventDefault(), [])}>
		{deleted && <Callout type='danger' title={t('Room_has_been_deleted')}></Callout>}

		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput disabled={deleted || room.t === 'd'} value={newData.roomName ?? roomName} onChange={handleChange('roomName', roomName)} flexGrow={1}/>
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
				<Field.Label>{t('Topic')}</Field.Label>
				<Field.Row>
					<TextInput disabled={deleted} value={(newData.roomTopic ?? room.topic) || ''} onChange={handleChange('roomTopic', room.topic)} flexGrow={1}/>
				</Field.Row>
			</Field>
			<Divider />
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Public')}</Field.Label>
						<RadioButton disabled={deleted} checked={roomType !== 'p'} onChange={handleChange('roomType', room.t, updateType(roomType))}/>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Private')}</Field.Label>
						<RadioButton disabled={deleted} checked={roomType === 'p'} onChange={handleChange('roomType', room.t, updateType(roomType))}/>
					</Box>
				</Field.Row>
			</Field>
			<Divider />
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Read_only')}</Field.Label>
						<ToggleSwitch disabled={deleted} checked={readOnly} onChange={handleChange('readOnly', room.ro, () => !readOnly)}/>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Archived')}</Field.Label>
						<ToggleSwitch disabled={deleted} checked={isArchived} onChange={() => setChangeArchivation(!changeArchivation)}/>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Default')}</Field.Label>
						<ToggleSwitch disabled={deleted} checked={isDefault} onChange={handleChange('default', room.default, () => !isDefault)}/>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Favorite')}</Field.Label>
						<ToggleSwitch disabled={deleted} checked={isFavorite} onChange={handleChange('favorite', room.favorite, () => !isFavorite)}/>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
						<Field.Label>{t('Featured')}</Field.Label>
						<ToggleSwitch disabled={deleted} checked={isFeatured} onChange={handleChange('featured', room.featured, () => !isFeatured)}/>
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<Margins inlineEnd='x4'>
							<Button disabled={deleted} flexGrow={1} type='reset' disabled={!hasUnsavedChanges && !changeArchivation} onClick={() => setNewData({})}>{t('Reset')}</Button>
							<Button disabled={deleted} mie='none' flexGrow={1} disabled={!hasUnsavedChanges && !changeArchivation} onClick={handleSave}>{t('Save')}</Button>
						</Margins>
					</Box>
				</Field.Row>
			</Field>
		</>}
		<Field>
			<Field.Row>
				<Button primary danger disabled={deleted || !canDelete} onClick={handleDelete} display='flex' alignItems='center' justifyContent='center' flexGrow={1}><Icon name='trash' size='x16' />{t('Delete')}</Button>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
