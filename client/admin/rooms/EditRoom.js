import React, { useCallback, useState, useMemo } from 'react';
import { Box, Skeleton, Field, ToggleSwitch } from '@rocket.chat/fuselage';

import VerticalBar from '../../components/basic/VerticalBar';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import EditRoomForm from '../../components/EditRoomForm';
import { useTranslation } from '../../contexts/TranslationContext';
import { useForm } from '../../hooks/useForm';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { roomTypes } from '../../../app/utils/client';
import { useMethod } from '../../contexts/ServerContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';

const getInitialValues = (room) => ({
	roomName: room.t === 'd' ? room.usernames.join(' x ') : roomTypes.getRoomName(room.t, { type: room.t, ...room }),
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

export function EditRoomContextBar({ rid }) {
	const canViewRoomAdministration = usePermission('view-room-administration');
	return canViewRoomAdministration ? <EditRoomWithData rid={rid}/> : <NotAuthorizedPage/>;
}

function EditRoomWithData({ rid }) {
	const { data = {}, state, error, reload } = useEndpointDataExperimental('rooms.adminRooms.getRoom', useMemo(() => ({ rid }), [rid]));

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

	return <EditRoom room={{ type: data.t, ...data }} onChange={reload}/>;
}

function EditRoom({ room, onChange }) {
	const t = useTranslation();

	const [deleted, setDeleted] = useState(false);

	const { values, handlers, hasUnsavedChanges, reset } = useForm(getInitialValues(room));

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
	} = handlers;

	const changeArchivation = archived !== !!room.archived;

	const canDelete = usePermission(`delete-${ room.t }`);

	const archiveSelector = room.archived ? 'unarchive' : 'archive';
	const archiveMessage = room.archived ? 'Room_has_been_unarchived' : 'Room_has_been_archived';

	const saveAction = useEndpointActionExperimental('POST', 'rooms.saveRoomSettings', t('Room_updated_successfully'));
	const archiveAction = useEndpointActionExperimental('POST', 'rooms.changeArchivationState', t(archiveMessage));

	const handleSave = async () => {
		const save = () => saveAction({
			rid: room._id,
			roomName,
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

		await Promise.all([hasUnsavedChanges && save(), changeArchivation && archive()].filter(Boolean));
		onChange();
	};

	const deleteRoom = useMethod('eraseRoom');

	const handleDelete = useCallback(async () => {
		await deleteRoom(room._id);
		setDeleted(true);
	}, [deleteRoom, room._id]);

	const append = useMemo(() => <>
		<Field>
			<Field.Row>
				<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
					<Field.Label>{t('Default')}</Field.Label>
					<ToggleSwitch disabled={deleted} checked={isDefault} onChange={handleIsDefault}/>
				</Box>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
					<Field.Label>{t('Favorite')}</Field.Label>
					<ToggleSwitch disabled={deleted} checked={favorite} onChange={handleFavorite}/>
				</Box>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
					<Field.Label>{t('Featured')}</Field.Label>
					<ToggleSwitch disabled={deleted} checked={featured} onChange={handleFeatured}/>
				</Box>
			</Field.Row>
		</Field>
	</>, [deleted, favorite, featured, handleFavorite, handleFeatured, handleIsDefault, isDefault, t]);

	return <VerticalBar.ScrollableContent is='form' onSubmit={useCallback((e) => e.preventDefault(), [])}>
		<EditRoomForm
			values={values}
			handlers={handlers}
			onSave={handleSave}
			onDelete={handleDelete}
			canDelete={canDelete}
			onReset={reset}
			deleted={deleted}
			room={room}
			hasUnsavedChanges={hasUnsavedChanges}
			append={append}
		/>
	</VerticalBar.ScrollableContent>;
}
