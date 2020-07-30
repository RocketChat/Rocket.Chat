import React, { useCallback, useState, useMemo } from 'react';
import {
	Field,
	TextInput,
	ToggleSwitch,
	MultiSelect,
	Accordion,
	Callout,
	NumberInput,
	FieldGroup,
	Button,
	ButtonGroup,
	Box,
	Icon,
	TextAreaInput,
} from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import VerticalBar from '../../components/basic/VerticalBar';
import RawText from '../../components/basic/RawText';
import RoomAvatarEditor from '../../components/basic/avatar/RoomAvatarEditor';
import DeleteChannelWarning from '../../components/DeleteChannelWarning';
import { useTranslation } from '../../contexts/TranslationContext';
import { useForm } from '../../hooks/useForm';
import { roomTypes, RoomSettingsEnum } from '../../../app/utils/client';
import { MessageTypesValues } from '../../../app/lib/lib/MessageTypes';
import { useMethod } from '../../contexts/ServerContext';
import { useSetModal } from '../../contexts/ModalContext';
import { useSession } from '../../contexts/SessionContext';
import { useSetting } from '../../contexts/SettingsContext';
import { usePermission, useAtLeastOnePermission, useRole } from '../../contexts/AuthorizationContext';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';
import { useUserRoom } from '../hooks/useUserRoom';

const typeMap = {
	c: 'Channels',
	p: 'Groups',
	d: 'DMs',
};

const useInitialValues = (room, settings) => {
	const {
		t,
		ro,
		archived,
		topic,
		description,
		announcement,
		joinCodeRequired,
		sysMes,
		encrypted,
		retention = {},
	} = room;

	const {
		retentionPolicyEnabled,
		maxAgeDefault,
	} = settings;

	const retentionEnabledDefault = useSetting(`RetentionPolicy_AppliesTo${ typeMap[room.t] }`);
	const excludePinnedDefault = useSetting('RetentionPolicy_DoNotPrunePinned');
	const filesOnlyDefault = useSetting('RetentionPolicy_FilesOnly');

	return useMemo(() => ({
		roomName: t === 'd' ? room.usernames.join(' x ') : roomTypes.getRoomName(t, { type: t, ...room }),
		roomType: t,
		readOnly: !!ro,
		reactWhenReadOnly: false,
		archived: !!archived,
		roomTopic: topic ?? '',
		roomDescription: description ?? '',
		roomAnnouncement: announcement ?? '',
		roomAvatar: undefined,
		joinCode: '',
		joinCodeRequired: !!joinCodeRequired,
		systemMessages: Array.isArray(sysMes) ? sysMes : [],
		hideSysMes: !!sysMes?.length,
		encrypted,
		...retentionPolicyEnabled && {
			retentionEnabled: retention.enabled ?? retentionEnabledDefault,
			retentionOverrideGlobal: !!retention.overrideGlobal,
			retentionMaxAge: Math.min(retention.maxAge, maxAgeDefault),
			retentionExcludePinned: retention.excludePinned ?? excludePinnedDefault,
			retentionFilesOnly: retention.filesOnly ?? filesOnlyDefault,
		},
	}), [
		announcement,
		archived,
		description,
		excludePinnedDefault,
		filesOnlyDefault,
		joinCodeRequired,
		maxAgeDefault,
		retention.enabled,
		retention.excludePinned,
		retention.filesOnly,
		retention.maxAge,
		retention.overrideGlobal,
		retentionEnabledDefault,
		retentionPolicyEnabled,
		ro,
		room,
		sysMes,
		t,
		topic,
		encrypted,
	]);
};

function EditChannelWithData({ rid }) {
	const room = useUserRoom(rid);

	return <EditChannel room={{ type: room?.t, ...room }}/>;
}

const getCanChangeType = (room, canCreateChannel, canCreateGroup, isAdmin) => (!room.default || isAdmin) && ((room.t === 'p' && canCreateChannel) || (room.t === 'c' && canCreateGroup));

function EditChannel({ room }) {
	const t = useTranslation();

	const [deleted, setDeleted] = useState(false);

	const setModal = useSetModal();

	const retentionPolicyEnabled = useSetting('RetentionPolicy_Enabled');
	const maxAgeDefault = useSetting(`RetentionPolicy_MaxAge_${ typeMap[room.t] }`) || 30;

	const { values, handlers, hasUnsavedChanges, reset, commit } = useForm(useInitialValues(room, { retentionPolicyEnabled, maxAgeDefault }));

	const sysMesOptions = useMemo(() => MessageTypesValues.map(({ key, i18nLabel }) => [key, t(i18nLabel)]), [t]);

	const {
		roomName,
		roomType,
		readOnly,
		encrypted,
		archived,
		roomTopic,
		roomAvatar,
		roomDescription,
		roomAnnouncement,
		reactWhenReadOnly,
		joinCode,
		joinCodeRequired,
		systemMessages,
		hideSysMes,
		retentionEnabled,
		retentionOverrideGlobal,
		retentionMaxAge,
		retentionExcludePinned,
		retentionFilesOnly,
	} = values;

	const {
		handleJoinCode,
		handleJoinCodeRequired,
		handleSystemMessages,
		handleEncrypted,
		handleHideSysMes,
		handleRoomName,
		handleReadOnly,
		handleArchived,
		handleRoomAvatar,
		handleReactWhenReadOnly,
		handleRoomType,
		handleRoomTopic,
		handleRoomDescription,
		handleRoomAnnouncement,
		handleRetentionEnabled,
		handleRetentionOverrideGlobal,
		handleRetentionMaxAge,
		handleRetentionExcludePinned,
		handleRetentionFilesOnly,
	} = handlers;

	const [
		canViewName,
		canViewTopic,
		canViewAnnouncement,
		canViewArchived,
		canViewDescription,
		canViewType,
		canViewReadOnly,
		canViewHideSysMes,
		canViewJoinCode,
		canViewReactWhenReadOnly,
		canViewEncrypted,
	] = useMemo(() => {
		const isAllowed = roomTypes.getConfig(room.t)?.allowRoomSettingChange || (() => {});
		return [
			isAllowed(room, RoomSettingsEnum.NAME),
			isAllowed(room, RoomSettingsEnum.TOPIC),
			isAllowed(room, RoomSettingsEnum.ANNOUNCEMENT),
			isAllowed(room, RoomSettingsEnum.ARCHIVE_OR_UNARCHIVE),
			isAllowed(room, RoomSettingsEnum.DESCRIPTION),
			isAllowed(room, RoomSettingsEnum.TYPE),
			isAllowed(room, RoomSettingsEnum.READ_ONLY),
			isAllowed(room, RoomSettingsEnum.SYSTEM_MESSAGES),
			isAllowed(room, RoomSettingsEnum.JOIN_CODE),
			isAllowed(room, RoomSettingsEnum.REACT_WHEN_READ_ONLY),
			isAllowed(room, RoomSettingsEnum.E2E),
		];
	}, [room]);

	const isAdmin = useRole('admin');

	const canCreateChannel = usePermission('create-c');
	const canCreateGroup = usePermission('create-p');
	const canChangeType = getCanChangeType(room, canCreateChannel, canCreateGroup, isAdmin);
	const canSetRo = usePermission('set-readonly', room._id);
	const canSetReactWhenRo = usePermission('set-react-when-readonly', room._id);
	const canEditPrivilegedSetting = usePermission('edit-privileged-setting', room._id);
	const canArchiveOrUnarchive = useAtLeastOnePermission(useMemo(() => ['archive-room', 'unarchive-room'], []));
	const canDelete = usePermission(`delete-${ room.t }`);

	const changeArchivation = archived !== !!room.archived;
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
			roomDescription,
			roomAnnouncement,
			roomAvatar,
			...joinCode && { joinCode: joinCodeRequired ? joinCode : '' },
			systemMessages: hideSysMes ? systemMessages : [],
			...retentionPolicyEnabled && {
				retentionEnabled,
				...retentionOverrideGlobal !== room.retention?.overrideGlobal && { retentionOverrideGlobal },
				retentionMaxAge,
				retentionExcludePinned,
				retentionFilesOnly,
			},
		});

		const archive = () => archiveAction({ rid: room._id, action: archiveSelector });

		await Promise.all([hasUnsavedChanges && save(), changeArchivation && archive()].filter(Boolean));
		commit();
	});

	const deleteRoom = useMethod('eraseRoom');

	const handleDelete = useMutableCallback(() => {
		const onCancel = () => setModal(undefined);
		const onConfirm = async () => {
			await deleteRoom(room._id);
			onCancel();
			setDeleted(true);
		};

		setModal(<DeleteChannelWarning onConfirm={onConfirm} onCancel={onCancel} />);
	});

	const changeRoomType = useMutableCallback(() => {
		handleRoomType(roomType === 'p' ? 'c' : 'p');
	});

	const onChangeMaxAge = useMutableCallback((e) => {
		handleRetentionMaxAge(Math.max(1, Number(e.currentTarget.value)));
	});

	return <VerticalBar.ScrollableContent p='0' is='form' onSubmit={useMutableCallback((e) => e.preventDefault())} >
		{deleted && <Callout type='danger' title={t('Room_has_been_deleted')}></Callout>}
		<RoomAvatarEditor room={room} onChangeAvatar={handleRoomAvatar}/>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput disabled={deleted || !canViewName} value={roomName} onChange={handleRoomName} flexGrow={1}/>
			</Field.Row>
		</Field>
		{canViewDescription && <Field>
			<Field.Label>{t('Description')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows={4} disabled={deleted} value={roomDescription} onChange={handleRoomDescription} flexGrow={1}/>
			</Field.Row>
		</Field>}
		{canViewAnnouncement && <Field>
			<Field.Label>{t('Announcement')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows={4} disabled={deleted} value={roomAnnouncement} onChange={handleRoomAnnouncement} flexGrow={1}/>
			</Field.Row>
		</Field>}
		{canViewTopic && <Field>
			<Field.Label>{t('Topic')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows={4} disabled={deleted} value={roomTopic} onChange={handleRoomTopic} flexGrow={1}/>
			</Field.Row>
		</Field>}
		{canViewType && <Field>
			<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
				<Field.Label>{t('Private')}</Field.Label>
				<Field.Row>
					<ToggleSwitch disabled={deleted || !canChangeType} checked={roomType === 'p'} onChange={changeRoomType}/>
				</Field.Row>
			</Box>
			<Field.Hint>{t('Just_invited_people_can_access_this_channel')}</Field.Hint>
		</Field>}
		{canViewReadOnly && <Field>
			<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
				<Field.Label>{t('Read_only')}</Field.Label>
				<Field.Row>
					<ToggleSwitch disabled={deleted || !canSetRo} checked={readOnly} onChange={handleReadOnly}/>
				</Field.Row>
			</Box>
			<Field.Hint>{t('Only_authorized_users_can_write_new_messages')}</Field.Hint>
		</Field>}
		{canViewReactWhenReadOnly && <Field>
			<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
				<Field.Label>{t('React_when_read_only')}</Field.Label>
				<Field.Row>
					<ToggleSwitch disabled={deleted || !canSetReactWhenRo} checked={reactWhenReadOnly} onChange={handleReactWhenReadOnly}/>
				</Field.Row>
			</Box>
			<Field.Hint>{t('Only_authorized_users_can_write_new_messages')}</Field.Hint>
		</Field>}
		{canViewArchived && <Field>
			<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
				<Field.Label>{t('Archived')}</Field.Label>
				<Field.Row>
					<ToggleSwitch disabled={deleted || !canArchiveOrUnarchive} checked={archived} onChange={handleArchived}/>
				</Field.Row>
			</Box>
		</Field>}
		{canViewJoinCode && <Field>
			<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
				<Field.Label>{t('Password_to_access')}</Field.Label>
				<Field.Row>
					<ToggleSwitch disabled={deleted} checked={joinCodeRequired} onChange={handleJoinCodeRequired}/>
				</Field.Row>
			</Box>
			<Field.Row>
				<TextInput disabled={deleted || !joinCodeRequired} value={joinCode} onChange={handleJoinCode} placeholder={t('Reset_password')} flexGrow={1}/>
			</Field.Row>
		</Field>}
		{canViewHideSysMes && <Field>
			<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
				<Field.Label>{t('Hide_System_Messages')}</Field.Label>
				<Field.Row>
					<ToggleSwitch disabled={deleted} checked={hideSysMes} onChange={handleHideSysMes}/>
				</Field.Row>
			</Box>
			<Field.Row>
				<MultiSelect options={sysMesOptions} disabled={deleted || !hideSysMes} value={systemMessages} onChange={handleSystemMessages} placeholder={t('Select_an_option')} flexGrow={1}/>
			</Field.Row>
		</Field>}
		{canViewEncrypted && <Field>
			<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
				<Field.Label>{t('Encrypted')}</Field.Label>
				<Field.Row>
					<ToggleSwitch disabled={deleted} checked={encrypted} onChange={handleEncrypted}/>
				</Field.Row>
			</Box>
		</Field>}
		{retentionPolicyEnabled && <Accordion>
			<Accordion.Item disabled={deleted} title={t('Prune')}>
				<FieldGroup>
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label>{t('RetentionPolicyRoom_Enabled')}</Field.Label>
							<Field.Row>
								<ToggleSwitch disabled={deleted} checked={retentionEnabled} onChange={handleRetentionEnabled}/>
							</Field.Row>
						</Box>
					</Field>
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label>{t('RetentionPolicyRoom_OverrideGlobal')}</Field.Label>
							<Field.Row>
								<ToggleSwitch disabled={deleted || !retentionEnabled || !canEditPrivilegedSetting} checked={retentionOverrideGlobal} onChange={handleRetentionOverrideGlobal}/>
							</Field.Row>
						</Box>
					</Field>
					{retentionOverrideGlobal && <>
						<Callout type='danger'>
							<RawText>{t('RetentionPolicyRoom_ReadTheDocs')}</RawText>
						</Callout>
						<Field>
							<Field.Label>{t('RetentionPolicyRoom_MaxAge')}</Field.Label>
							<Field.Row>
								<NumberInput disabled={deleted} value={retentionMaxAge} onChange={onChangeMaxAge} flexGrow={1}/>
							</Field.Row>
						</Field>
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
								<Field.Label>{t('RetentionPolicyRoom_ExcludePinned')}</Field.Label>
								<Field.Row>
									<ToggleSwitch disabled={deleted} checked={retentionExcludePinned} onChange={handleRetentionExcludePinned}/>
								</Field.Row>
							</Box>
						</Field>
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
								<Field.Label>{t('RetentionPolicyRoom_FilesOnly')}</Field.Label>
								<Field.Row>
									<ToggleSwitch disabled={deleted} checked={retentionFilesOnly} onChange={handleRetentionFilesOnly}/>
								</Field.Row>
							</Box>
						</Field>
					</>}
				</FieldGroup>
			</Accordion.Item>
		</Accordion>}
		<Field>
			<Field.Row>
				<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
					<ButtonGroup stretch flexGrow={1}>
						<Button type='reset' disabled={!hasUnsavedChanges || deleted} onClick={reset}>{t('Reset')}</Button>
						<Button flexGrow={1} disabled={!hasUnsavedChanges || deleted} onClick={handleSave}>{t('Save')}</Button>
					</ButtonGroup>
				</Box>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Button flexGrow={1} primary danger disabled={deleted || !canDelete} onClick={handleDelete} ><Icon name='trash' size='x16' />{t('Delete')}</Button>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}

export default EditChannelWithData;
