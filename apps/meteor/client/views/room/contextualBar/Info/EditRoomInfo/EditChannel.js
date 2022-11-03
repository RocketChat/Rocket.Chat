import { isRoomFederated } from '@rocket.chat/core-typings';
import {
	Field,
	TextInput,
	PasswordInput,
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
import {
	useSetModal,
	useSetting,
	usePermission,
	useAtLeastOnePermission,
	useRole,
	useMethod,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo, useRef } from 'react';

import { e2e } from '../../../../../../app/e2e/client/rocketchat.e2e';
import { MessageTypesValues } from '../../../../../../app/lib/lib/MessageTypes';
import { RoomSettingsEnum } from '../../../../../../definition/IRoomTypeConfig';
import GenericModal from '../../../../../components/GenericModal';
import RawText from '../../../../../components/RawText';
import VerticalBar from '../../../../../components/VerticalBar';
import RoomAvatarEditor from '../../../../../components/avatar/RoomAvatarEditor';
import { useEndpointActionExperimental } from '../../../../../hooks/useEndpointActionExperimental';
import { useForm } from '../../../../../hooks/useForm';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';

const typeMap = {
	c: 'Channels',
	p: 'Groups',
	d: 'DMs',
};

const useInitialValues = (room, settings) => {
	const { t, ro, archived, topic, description, announcement, joinCodeRequired, sysMes, encrypted, retention = {} } = room;

	const { retentionPolicyEnabled, maxAgeDefault } = settings;

	const retentionEnabledDefault = useSetting(`RetentionPolicy_AppliesTo${typeMap[room.t]}`);
	const excludePinnedDefault = useSetting('RetentionPolicy_DoNotPrunePinned');
	const filesOnlyDefault = useSetting('RetentionPolicy_FilesOnly');

	return useMemo(
		() => ({
			roomName: t === 'd' ? room.usernames.join(' x ') : roomCoordinator.getRoomName(t, { type: t, ...room }),
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
			...(retentionPolicyEnabled && {
				retentionEnabled: retention.enabled ?? retentionEnabledDefault,
				retentionOverrideGlobal: !!retention.overrideGlobal,
				retentionMaxAge: Math.min(retention.maxAge, maxAgeDefault) || maxAgeDefault,
				retentionExcludePinned: retention.excludePinned ?? excludePinnedDefault,
				retentionFilesOnly: retention.filesOnly ?? filesOnlyDefault,
			}),
		}),
		[
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
		],
	);
};

const getCanChangeType = (room, canCreateChannel, canCreateGroup, isAdmin) =>
	(!room.default || isAdmin) && ((room.t === 'p' && canCreateChannel) || (room.t === 'c' && canCreateGroup));

function EditChannel({ room, onClickClose, onClickBack }) {
	const t = useTranslation();

	const setModal = useSetModal();

	const retentionPolicyEnabled = useSetting('RetentionPolicy_Enabled');
	const maxAgeDefault = useSetting(`RetentionPolicy_MaxAge_${typeMap[room.t]}`) || 30;

	const saveData = useRef({});

	const onChange = useCallback(({ initialValue, value, key }) => {
		const { current } = saveData;
		if (JSON.stringify(initialValue) !== JSON.stringify(value)) {
			if (key === 'systemMessages' && value?.length > 0) {
				current.hideSysMes = true;
			}
			current[key] = value;
		} else {
			delete current[key];
		}
	}, []);

	const { values, handlers, hasUnsavedChanges, reset, commit } = useForm(
		useInitialValues(room, { retentionPolicyEnabled, maxAgeDefault }),
		onChange,
	);

	const sysMesOptions = useMemo(() => MessageTypesValues.map(({ key, i18nLabel }) => [key, t(i18nLabel)]), [t]);

	const {
		roomName,
		roomType,
		readOnly,
		encrypted,
		roomAvatar,
		archived,
		roomTopic,
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
		const isAllowed = roomCoordinator.getRoomDirectives(room.t)?.allowRoomSettingChange || (() => {});
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
	const canEditRoomRetentionPolicy = usePermission('edit-room-retention-policy', room._id);
	const canArchiveOrUnarchive = useAtLeastOnePermission(
		useMemo(() => ['archive-room', 'unarchive-room'], []),
		room._id,
	);
	const canDelete = usePermission(`delete-${room.t}`);
	const canToggleEncryption = usePermission('toggle-room-e2e-encryption', room._id) && (room.encrypted || e2e.isReady());

	const changeArchivation = archived !== !!room.archived;
	const archiveSelector = room.archived ? 'unarchive' : 'archive';
	const archiveMessage = room.archived ? 'Room_has_been_unarchived' : 'Room_has_been_archived';
	const saveAction = useEndpointActionExperimental('POST', '/v1/rooms.saveRoomSettings', t('Room_updated_successfully'));
	const archiveAction = useEndpointActionExperimental('POST', '/v1/rooms.changeArchivationState', t(archiveMessage));

	const handleSave = useMutableCallback(async () => {
		const { joinCodeRequired, hideSysMes, ...data } = saveData.current;
		delete data.archived;
		const save = () =>
			saveAction({
				rid: room._id,
				...data,
				...(joinCode && { joinCode: joinCodeRequired ? joinCode : '' }),
				...((data.systemMessages || !hideSysMes) && {
					systemMessages: hideSysMes && systemMessages,
				}),
			});

		const archive = () => archiveAction({ rid: room._id, action: archiveSelector });

		await Promise.all([hasUnsavedChanges && save(), changeArchivation && archive()].filter(Boolean));
		saveData.current = {};
		commit();
	});

	const deleteRoom = useMethod('eraseRoom');

	const handleDelete = useMutableCallback(() => {
		const onCancel = () => setModal(undefined);
		const onConfirm = async () => {
			await deleteRoom(room._id);
			onCancel();
		};

		setModal(
			<GenericModal variant='danger' onConfirm={onConfirm} onCancel={onCancel} confirmText={t('Yes_delete_it')}>
				{t('Delete_Room_Warning')}
			</GenericModal>,
		);
	});

	const changeRoomType = useMutableCallback(() => {
		handleRoomType(roomType === 'p' ? 'c' : 'p');
	});

	const onChangeMaxAge = useMutableCallback((e) => {
		handleRetentionMaxAge(Math.max(1, Number(e.currentTarget.value)));
	});

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Back onClick={onClickBack} />}
				<VerticalBar.Text>{t('edit-room')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent p='x24' is='form' onSubmit={useMutableCallback((e) => e.preventDefault())}>
				<Box display='flex' justifyContent='center'>
					<RoomAvatarEditor room={room} roomAvatar={roomAvatar} onChangeAvatar={handleRoomAvatar} />
				</Box>
				<Field>
					<Field.Label>{t('Name')}</Field.Label>
					<Field.Row>
						<TextInput disabled={!canViewName} value={roomName} onChange={handleRoomName} flexGrow={1} />
					</Field.Row>
				</Field>
				{canViewDescription && (
					<Field>
						<Field.Label>{t('Description')}</Field.Label>
						<Field.Row>
							<TextAreaInput rows={4} value={roomDescription} onChange={handleRoomDescription} flexGrow={1} />
						</Field.Row>
					</Field>
				)}
				{canViewAnnouncement && (
					<Field>
						<Field.Label>{t('Announcement')}</Field.Label>
						<Field.Row>
							<TextAreaInput rows={4} value={roomAnnouncement} onChange={handleRoomAnnouncement} flexGrow={1} />
						</Field.Row>
					</Field>
				)}
				{canViewTopic && (
					<Field>
						<Field.Label>{t('Topic')}</Field.Label>
						<Field.Row>
							<TextAreaInput rows={4} value={roomTopic} onChange={handleRoomTopic} flexGrow={1} />
						</Field.Row>
					</Field>
				)}
				{canViewType && (
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label>{t('Private')}</Field.Label>
							<Field.Row>
								<ToggleSwitch disabled={!canChangeType || isRoomFederated(room)} checked={roomType === 'p'} onChange={changeRoomType} />
							</Field.Row>
						</Box>
						<Field.Hint>{t('Teams_New_Private_Description_Enabled')}</Field.Hint>
					</Field>
				)}
				{canViewReadOnly && (
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label>{t('Read_only')}</Field.Label>
							<Field.Row>
								<ToggleSwitch disabled={!canSetRo || isRoomFederated(room)} checked={readOnly} onChange={handleReadOnly} />
							</Field.Row>
						</Box>
						<Field.Hint>{t('Only_authorized_users_can_write_new_messages')}</Field.Hint>
					</Field>
				)}
				{canViewReactWhenReadOnly && (
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label>{t('React_when_read_only')}</Field.Label>
							<Field.Row>
								<ToggleSwitch disabled={!canSetReactWhenRo} checked={reactWhenReadOnly} onChange={handleReactWhenReadOnly} />
							</Field.Row>
						</Box>
						<Field.Hint>{t('Only_authorized_users_can_react_to_messages')}</Field.Hint>
					</Field>
				)}
				{canViewArchived && (
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label>{t('Room_archivation_state_true')}</Field.Label>
							<Field.Row>
								<ToggleSwitch disabled={!canArchiveOrUnarchive} checked={archived} onChange={handleArchived} />
							</Field.Row>
						</Box>
					</Field>
				)}
				{canViewJoinCode && (
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label>{t('Password_to_access')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={joinCodeRequired} onChange={handleJoinCodeRequired} />
							</Field.Row>
						</Box>
						<Field.Row>
							<PasswordInput
								disabled={!joinCodeRequired}
								value={joinCode}
								onChange={handleJoinCode}
								placeholder={t('Reset_password')}
								flexGrow={1}
							/>
						</Field.Row>
					</Field>
				)}
				{canViewHideSysMes && (
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label>{t('Hide_System_Messages')}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={hideSysMes} onChange={handleHideSysMes} />
							</Field.Row>
						</Box>
						<Field.Row>
							<MultiSelect
								maxWidth='100%'
								options={sysMesOptions}
								disabled={!hideSysMes}
								value={systemMessages}
								onChange={handleSystemMessages}
								placeholder={t('Select_an_option')}
								flexGrow={1}
							/>
						</Field.Row>
					</Field>
				)}
				{canViewEncrypted && (
					<Field>
						<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
							<Field.Label>{t('Encrypted')}</Field.Label>
							<Field.Row>
								<ToggleSwitch disabled={!canToggleEncryption} checked={encrypted} onChange={handleEncrypted} />
							</Field.Row>
						</Box>
					</Field>
				)}
				{retentionPolicyEnabled && (
					<Accordion>
						<Accordion.Item title={t('Prune')}>
							<FieldGroup>
								<Field>
									<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
										<Field.Label>{t('RetentionPolicyRoom_Enabled')}</Field.Label>
										<Field.Row>
											<ToggleSwitch checked={retentionEnabled} onChange={handleRetentionEnabled} />
										</Field.Row>
									</Box>
								</Field>
								<Field>
									<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
										<Field.Label>{t('RetentionPolicyRoom_OverrideGlobal')}</Field.Label>
										<Field.Row>
											<ToggleSwitch
												disabled={!retentionEnabled || !canEditRoomRetentionPolicy}
												checked={retentionOverrideGlobal}
												onChange={handleRetentionOverrideGlobal}
											/>
										</Field.Row>
									</Box>
								</Field>
								{retentionOverrideGlobal && (
									<>
										<Callout type='danger'>
											<RawText>{t('RetentionPolicyRoom_ReadTheDocs')}</RawText>
										</Callout>
										<Field>
											<Field.Label>{t('RetentionPolicyRoom_MaxAge', { max: maxAgeDefault })}</Field.Label>
											<Field.Row>
												<NumberInput value={retentionMaxAge} onChange={onChangeMaxAge} flexGrow={1} />
											</Field.Row>
										</Field>
										<Field>
											<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
												<Field.Label>{t('RetentionPolicyRoom_ExcludePinned')}</Field.Label>
												<Field.Row>
													<ToggleSwitch checked={retentionExcludePinned} onChange={handleRetentionExcludePinned} />
												</Field.Row>
											</Box>
										</Field>
										<Field>
											<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
												<Field.Label>{t('RetentionPolicyRoom_FilesOnly')}</Field.Label>
												<Field.Row>
													<ToggleSwitch checked={retentionFilesOnly} onChange={handleRetentionFilesOnly} />
												</Field.Row>
											</Box>
										</Field>
									</>
								)}
							</FieldGroup>
						</Accordion.Item>
					</Accordion>
				)}
				<Field>
					<Field.Row>
						<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
							<ButtonGroup stretch flexGrow={1}>
								<Button type='reset' disabled={!hasUnsavedChanges} onClick={reset}>
									{t('Reset')}
								</Button>
								<Button flexGrow={1} disabled={!hasUnsavedChanges} onClick={handleSave}>
									{t('Save')}
								</Button>
							</ButtonGroup>
						</Box>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<Button flexGrow={1} danger disabled={!canDelete} onClick={handleDelete}>
							<Icon name='trash' size='x16' />
							{t('Delete')}
						</Button>
					</Field.Row>
				</Field>
			</VerticalBar.ScrollableContent>
		</>
	);
}

export default EditChannel;
