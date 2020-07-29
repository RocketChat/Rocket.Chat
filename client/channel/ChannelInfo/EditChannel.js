import React, { useCallback, useState, useMemo } from 'react';
import { Box, Skeleton, Field, TextInput, ToggleSwitch, MultiSelect } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import VerticalBar from '../../components/basic/VerticalBar';
// import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import EditRoomForm from '../../components/EditRoomForm';
import { useTranslation } from '../../contexts/TranslationContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useForm } from '../../hooks/useForm';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { roomTypes, RoomSettingsEnum } from '../../../app/utils/client';
import { ChatRoom } from '../../../app/models';
import { MessageTypesValues } from '../../../app/lib/lib/MessageTypes';
import { useMethod } from '../../contexts/ServerContext';
import { useSession } from '../../contexts/SessionContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';

const useRoom = (rid) => useReactiveValue(useCallback(() => ChatRoom.findOne(rid), [rid]));

const getInitialValues = (room) => ({
	roomName: room.t === 'd' ? room.usernames.join(' x ') : roomTypes.getRoomName(room.t, { type: room.t, ...room }),
	roomType: room.t,
	readOnly: !!room.ro,
	archived: !!room.archived,
	roomTopic: room.topic ?? '',
	roomDescription: room.description ?? '',
	roomAnnouncement: room.announcement ?? '',
	roomAvatar: undefined,
	joinCode: room.joinCodeRequired ? '******' : '',
	joinCodeRequired: !!room.joinCodeRequired,
	systemMessages: room.sysMes ?? [],
	hideSysMes: !!room.sysMes?.length,
});

// export function EditRoomContextBar({ rid }) {
// 	const canViewRoomAdministration = usePermission('view-room-administration');
// 	return canViewRoomAdministration ? <EditRoomWithData rid={rid}/> : <NotAuthorizedPage/>;
// }

const useRoomConfigs = (room) => {
	const isAllowed = roomTypes.getConfig(room.t).allowRoomSettingChange;
	return useMemo(() => ({
		canChangeJoinCode: isAllowed(room, RoomSettingsEnum.JOIN_CODE),
		canChangeBroadcast: isAllowed(room, RoomSettingsEnum.BROADCAST),
		canChangeHideSysMes: isAllowed(room, RoomSettingsEnum.SYSTEM_MESSAGES),
	}), [isAllowed, room]);
};

function EditChannelWithData() {
	// const { data = {}, state, error, reload } = useEndpointDataExperimental('rooms.adminRooms.getRoom', useMemo(() => ({ rid }), [rid]));

	// if (state === ENDPOINT_STATES.LOADING) {
	// 	return <Box w='full' pb='x24'>
	// 		<Skeleton mbe='x4'/>
	// 		<Skeleton mbe='x8' />
	// 		<Skeleton mbe='x4'/>
	// 		<Skeleton mbe='x8'/>
	// 		<Skeleton mbe='x4'/>
	// 		<Skeleton mbe='x8'/>
	// 	</Box>;
	// }

	// if (state === ENDPOINT_STATES.ERROR) {
	// 	return error.message;
	// }

	const rid = useSession('openedRoom');
	const room = useRoom(rid);

	console.log(room);
	return <EditChannel room={{ type: room.t, ...room }}/>;
}

function EditChannel({ room, onChange = () => {} }) {
	const t = useTranslation();

	const [deleted, setDeleted] = useState(false);

	const { values, handlers, hasUnsavedChanges, reset } = useForm(getInitialValues(room));

	const sysMesOptions = useMemo(() => MessageTypesValues.map(({ key, i18nLabel }) => [key, t(i18nLabel)]), [t]);

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
		joinCode,
		joinCodeRequired,
		systemMessages,
		hideSysMes,
	} = values;

	const {
		handleJoinCode,
		handleJoinCodeRequired,
		handleSystemMessages,
		handleHideSysMes,
	} = handlers;

	const {
		canChangeHideSysMes,
		canChangeJoinCode,
	} = useRoomConfigs(room);

	const changeArchivation = archived !== !!room.archived;

	const canDelete = usePermission(`delete-${ room.t }`);

	const archiveSelector = room.archived ? 'unarchive' : 'archive';
	const archiveMessage = room.archived ? 'Room_has_been_unarchived' : 'Room_has_been_archived';

	const saveAction = useEndpointActionExperimental('POST', 'rooms.saveRoomSettings', t('Room_updated_successfully'));
	const archiveAction = useEndpointActionExperimental('POST', 'rooms.changeArchivationState', t(archiveMessage));

	const handleSave = useMutableCallback(async () => {
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
	});

	const deleteRoom = useMethod('eraseRoom');

	const handleDelete = useMutableCallback(async () => {
		await deleteRoom(room._id);
		setDeleted(true);
	});

	const append = useMemo(() => <>
		{canChangeJoinCode && <Field>
			<Field.Row>
				<Field.Label>{t('Password_to_access')}</Field.Label>
				<ToggleSwitch disabled={deleted} checked={joinCodeRequired} onChange={handleJoinCodeRequired}/>
			</Field.Row>
			<Field.Row>
				<TextInput disabled={deleted || !joinCodeRequired} value={joinCode} onChange={handleJoinCode} placeholder={t('Reset_password')} flexGrow={1}/>
			</Field.Row>
		</Field>}
		{canChangeHideSysMes && <Field>
			<Field.Row>
				<Field.Label>{t('Hide_System_Messages')}</Field.Label>
				<ToggleSwitch disabled={deleted} checked={hideSysMes} onChange={handleHideSysMes}/>
			</Field.Row>
			<Field.Row>
				<MultiSelect options={sysMesOptions} disabled={deleted || !hideSysMes} value={systemMessages} onChange={handleSystemMessages} placeholder={t('Select_an_option')} flexGrow={1}/>
			</Field.Row>
		</Field>}
	</>, [canChangeHideSysMes, canChangeJoinCode, deleted, handleHideSysMes, handleJoinCode, handleJoinCodeRequired, handleSystemMessages, hideSysMes, joinCode, joinCodeRequired, sysMesOptions, systemMessages, t]);

	return <VerticalBar.ScrollableContent p='0' is='form' onSubmit={useMutableCallback((e) => e.preventDefault())} >
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

export default EditChannelWithData;
