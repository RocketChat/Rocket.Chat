import type { IRoom, IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
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
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import {
	useSetModal,
	useSetting,
	useMethod,
	useTranslation,
	useRoute,
	useToastMessageDispatch,
	useEndpoint,
} from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { MessageTypesValues } from '../../../../../../app/lib/lib/MessageTypes';
import GenericModal from '../../../../../components/GenericModal';
import RawText from '../../../../../components/RawText';
import VerticalBar from '../../../../../components/VerticalBar';
import RoomAvatarEditor from '../../../../../components/avatar/RoomAvatarEditor';
import { useEditRoomInitialValues } from './useEditRoomInitialValues';
import { useEditRoomPermissions } from './useEditRoomPermissions';

const typeMap = {
	c: 'Channels',
	p: 'Groups',
	d: 'DMs',
};

type EditRoomInfoProps = {
	room: IRoom | IRoomWithRetentionPolicy;
	onClickClose: () => void;
	onClickBack: () => void;
};

const EditRoomInfo = ({ room, onClickClose, onClickBack }: EditRoomInfoProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const router = useRoute('home');
	const dispatchToastMessage = useToastMessageDispatch();
	const isFederated = useMemo(() => isRoomFederated(room), [room]);

	const retentionPolicyEnabled = useSetting('RetentionPolicy_Enabled');
	const maxAgeDefault = useSetting(`RetentionPolicy_MaxAge_${typeMap[room.t]}`) || 30;

	// const { values, handlers, hasUnsavedChanges, reset, commit } = useForm(
	// 	useInitialValues(room, { retentionPolicyEnabled, maxAgeDefault }),
	// 	onChange,
	// );

	const defaultValues = useEditRoomInitialValues(room, { retentionPolicyEnabled, maxAgeDefault });

	const {
		register,
		watch,
		reset,
		control,
		handleSubmit,
		formState: { isDirty },
	} = useForm({ defaultValues });

	const handleResetForm = useMutableCallback(() => {
		reset(defaultValues);
	});

	const sysMesOptions: SelectOption[] = useMemo(
		() => MessageTypesValues.map(({ key, i18nLabel }) => [key, t(i18nLabel as TranslationKey)]),
		[t],
	);

	const { readOnly, archived, joinCode, joinCodeRequired, systemMessages, hideSysMes, retentionEnabled, retentionOverrideGlobal } = watch();

	const {
		canChangeType,
		canSetReadOnly,
		canSetReactWhenReadOnly,
		canEditRoomRetentionPolicy,
		canArchiveOrUnarchive,
		canDeleteRoom,
		canToggleEncryption,
		canViewName,
		canViewTopic,
		canViewAnnouncement,
		canViewArchived,
		canViewDescription,
		canViewType,
		canViewReadOnly,
		canViewHideSysMes,
		canViewJoinCode,
		canViewEncrypted,
	} = useEditRoomPermissions(room);

	const changeArchivation = archived !== !!room.archived;

	const saveAction = useEndpoint('POST', '/v1/rooms.saveRoomSettings');
	const archiveAction = useEndpoint('POST', '/v1/rooms.changeArchivationState');

	const handleUpdateRoomData = useMutableCallback(async (data) => {
		try {
			await saveAction({
				rid: room._id,
				...data,
				...(joinCode && { joinCode: joinCodeRequired ? joinCode : '' }),
				...((data.systemMessages || !hideSysMes) && {
					systemMessages: hideSysMes && systemMessages,
				}),
			});

			dispatchToastMessage({ type: 'success', message: t('Room_updated_successfully') });
			onClickClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleArchive = useMutableCallback(async () => {
		try {
			await archiveAction({ rid: room._id, action: room.archived ? 'unarchive' : 'archive' });
			dispatchToastMessage({ type: 'success', message: room.archived ? t('Room_has_been_unarchived') : t('Room_has_been_archived') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleSave = useMutableCallback(async (data) => {
		await Promise.all([isDirty && handleUpdateRoomData(data), changeArchivation && handleArchive()].filter(Boolean));
	});

	const deleteRoom = useMethod('eraseRoom');

	// TODO: Replace with deleteRoomAction hook
	const handleDelete = useMutableCallback(() => {
		const handleConfirmDelete = async () => {
			try {
				await deleteRoom(room._id);
				router.push({});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal variant='danger' onConfirm={handleConfirmDelete} onCancel={() => setModal(undefined)} confirmText={t('Yes_delete_it')}>
				{t('Delete_Room_Warning')}
			</GenericModal>,
		);
	});

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Back onClick={onClickBack} />}
				<VerticalBar.Text>{room.teamId ? t('edit-team') : t('edit-room')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent p='x24'>
				<Box display='flex' justifyContent='center'>
					<Controller
						control={control}
						name='roomAvatar'
						render={({ field: { onChange, value } }) => <RoomAvatarEditor room={room} roomAvatar={value} onChangeAvatar={onChange} />}
					/>
				</Box>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Name')}</Field.Label>
						<Field.Row>
							<TextInput {...register('roomName')} disabled={!canViewName} flexGrow={1} />
						</Field.Row>
					</Field>
					{canViewDescription && (
						<Field>
							<Field.Label>{t('Description')}</Field.Label>
							<Field.Row>
								<TextAreaInput {...register('roomDescription')} disabled={isFederated} rows={4} flexGrow={1} />
							</Field.Row>
						</Field>
					)}
					{canViewAnnouncement && (
						<Field>
							<Field.Label>{t('Announcement')}</Field.Label>
							<Field.Row>
								<TextAreaInput {...register('roomAnnouncement')} disabled={isFederated} rows={4} flexGrow={1} />
							</Field.Row>
						</Field>
					)}
					{canViewTopic && (
						<Field>
							<Field.Label>{t('Topic')}</Field.Label>
							<Field.Row>
								<TextAreaInput {...register('roomTopic')} rows={4} flexGrow={1} />
							</Field.Row>
						</Field>
					)}
					{canViewType && (
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
								<Field.Label>{t('Private')}</Field.Label>
								<Field.Row>
									<Controller
										control={control}
										name='roomType'
										render={({ field: { onChange, value, ref } }) => (
											<ToggleSwitch
												ref={ref}
												disabled={!canChangeType || isFederated}
												checked={value === 'p'}
												onChange={() => onChange(value === 'p' ? 'c' : 'p')}
											/>
										)}
									/>
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
									<Controller
										control={control}
										name='readOnly'
										render={({ field: { onChange, value, ref } }) => (
											<ToggleSwitch ref={ref} disabled={!canSetReadOnly || isFederated} checked={value} onChange={onChange} />
										)}
									/>
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
									<Controller
										control={control}
										name='reactWhenReadOnly'
										render={({ field: { onChange, value, ref } }) => (
											<ToggleSwitch ref={ref} disabled={!canSetReactWhenReadOnly} checked={value} onChange={onChange} />
										)}
									/>
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
									<Controller
										control={control}
										name='archived'
										render={({ field: { onChange, value, ref } }) => (
											<ToggleSwitch ref={ref} disabled={!canArchiveOrUnarchive} checked={value} onChange={onChange} />
										)}
									/>
								</Field.Row>
							</Box>
						</Field>
					)}
					{canViewJoinCode && (
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
								<Field.Label>{t('Password_to_access')}</Field.Label>
								<Field.Row>
									<Controller
										control={control}
										name='joinCodeRequired'
										render={({ field: { onChange, value, ref } }) => (
											<ToggleSwitch ref={ref} disabled={isFederated} checked={value} onChange={onChange} />
										)}
									/>
								</Field.Row>
							</Box>
							<Field.Row>
								<PasswordInput {...register('joinCode')} disabled={!joinCodeRequired} placeholder={t('Reset_password')} flexGrow={1} />
							</Field.Row>
						</Field>
					)}
					{canViewHideSysMes && (
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
								<Field.Label>{t('Hide_System_Messages')}</Field.Label>
								<Field.Row>
									<Controller
										control={control}
										name='hideSysMes'
										render={({ field: { onChange, value, ref } }) => (
											<ToggleSwitch ref={ref} checked={value} disabled={isFederated} onChange={onChange} />
										)}
									/>
								</Field.Row>
							</Box>
							<Field.Row>
								<Controller
									control={control}
									name='systemMessages'
									render={({ field: { onChange, value, ref } }) => (
										<MultiSelect
											ref={ref}
											options={sysMesOptions}
											disabled={!hideSysMes || isFederated}
											value={value}
											onChange={onChange}
											placeholder={t('Select_an_option')}
											flexGrow={1}
										/>
									)}
								/>
							</Field.Row>
						</Field>
					)}
					{canViewEncrypted && (
						<Field>
							<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
								<Field.Label>{t('Encrypted')}</Field.Label>
								<Field.Row>
									<Controller
										control={control}
										name='encrypted'
										render={({ field: { onChange, value, ref } }) => (
											<ToggleSwitch ref={ref} disabled={!canToggleEncryption || isFederated} checked={value} onChange={onChange} />
										)}
									/>
								</Field.Row>
							</Box>
						</Field>
					)}
				</FieldGroup>
				{retentionPolicyEnabled && (
					<Accordion>
						<Accordion.Item title={t('Prune')}>
							<FieldGroup>
								<Field>
									<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
										<Field.Label>{t('RetentionPolicyRoom_Enabled')}</Field.Label>
										<Field.Row>
											<Controller
												control={control}
												name='retentionEnabled'
												render={({ field: { onChange, value, ref } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
											/>
										</Field.Row>
									</Box>
								</Field>
								<Field>
									<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
										<Field.Label>{t('RetentionPolicyRoom_OverrideGlobal')}</Field.Label>
										<Field.Row>
											<Controller
												control={control}
												name='retentionOverrideGlobal'
												render={({ field: { onChange, value, ref } }) => (
													<ToggleSwitch
														ref={ref}
														disabled={!retentionEnabled || !canEditRoomRetentionPolicy}
														checked={value}
														onChange={onChange}
													/>
												)}
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
												<Controller
													control={control}
													name='retentionMaxAge'
													render={({ field: { value, ref, onChange } }) => (
														<NumberInput
															ref={ref}
															value={value}
															onChange={(currentValue) => onChange(Math.max(1, Number(currentValue)))}
															flexGrow={1}
														/>
													)}
												/>
											</Field.Row>
										</Field>
										<Field>
											<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
												<Field.Label>{t('RetentionPolicyRoom_ExcludePinned')}</Field.Label>
												<Field.Row>
													<Controller
														control={control}
														name='retentionExcludePinned'
														render={({ field: { onChange, value, ref } }) => <ToggleSwitch ref={ref} checked={value} onChange={onChange} />}
													/>
												</Field.Row>
											</Box>
										</Field>
										<Field>
											<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
												<Field.Label>{t('RetentionPolicyRoom_FilesOnly')}</Field.Label>
												<Field.Row>
													{
														<Controller
															control={control}
															name='retentionFilesOnly'
															render={({ field: { onChange, value, ref } }) => (
																<ToggleSwitch ref={ref} checked={value} onChange={onChange} />
															)}
														/>
													}
												</Field.Row>
											</Box>
										</Field>
									</>
								)}
							</FieldGroup>
						</Accordion.Item>
					</Accordion>
				)}
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch mbe='x12'>
					<Button type='reset' disabled={!isDirty} onClick={handleResetForm}>
						{t('Reset')}
					</Button>
					<Button disabled={!isDirty} onClick={handleSubmit(handleSave)}>
						{t('Save')}
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch>
					<Button danger disabled={!canDeleteRoom || isFederated} onClick={handleDelete}>
						<Icon name='trash' size='x16' />
						{t('Delete')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default EditRoomInfo;
