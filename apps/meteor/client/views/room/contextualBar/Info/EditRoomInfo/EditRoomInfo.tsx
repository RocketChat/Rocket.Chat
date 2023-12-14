import type { IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	Field,
	FieldRow,
	FieldLabel,
	FieldHint,
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
	TextAreaInput,
} from '@rocket.chat/fuselage';
import { useMutableCallback, useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useTranslation, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { MessageTypesValues } from '../../../../../../app/lib/lib/MessageTypes';
import {
	ContextualbarHeader,
	ContextualbarBack,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarFooter,
} from '../../../../../components/Contextualbar';
import RawText from '../../../../../components/RawText';
import RoomAvatarEditor from '../../../../../components/avatar/RoomAvatarEditor';
import { getDirtyFields } from '../../../../../lib/getDirtyFields';
import { useDeleteRoom } from '../../../../hooks/roomActions/useDeleteRoom';
import { useEditRoomInitialValues } from './useEditRoomInitialValues';
import { useEditRoomPermissions } from './useEditRoomPermissions';

type EditRoomInfoProps = {
	room: IRoomWithRetentionPolicy;
	onClickClose: () => void;
	onClickBack: () => void;
};

const EditRoomInfo = ({ room, onClickClose, onClickBack }: EditRoomInfoProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const isFederated = useMemo(() => isRoomFederated(room), [room]);

	const retentionPolicy = useSetting<boolean>('RetentionPolicy_Enabled');
	const { handleDelete, canDeleteRoom } = useDeleteRoom(room);
	const defaultValues = useEditRoomInitialValues(room);

	const {
		watch,
		reset,
		control,
		handleSubmit,
		formState: { isDirty, dirtyFields, errors, isSubmitting },
	} = useForm({ mode: 'onBlur', defaultValues });

	const sysMesOptions: SelectOption[] = useMemo(
		() => MessageTypesValues.map(({ key, i18nLabel }) => [key, t(i18nLabel as TranslationKey)]),
		[t],
	);

	const { readOnly, archived, joinCodeRequired, hideSysMes, retentionEnabled, retentionMaxAge, retentionOverrideGlobal } = watch();

	const {
		canChangeType,
		canSetReadOnly,
		canSetReactWhenReadOnly,
		canEditRoomRetentionPolicy,
		canArchiveOrUnarchive,
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

	const changeArchiving = archived !== !!room.archived;

	const saveAction = useEndpoint('POST', '/v1/rooms.saveRoomSettings');
	const archiveAction = useEndpoint('POST', '/v1/rooms.changeArchivationState');

	const handleUpdateRoomData = useMutableCallback(async ({ hideSysMes, ...formData }) => {
		const data = getDirtyFields(formData, dirtyFields);
		delete data.archived;

		try {
			await saveAction({
				rid: room._id,
				...data,
				...(data.joinCode && { joinCode: joinCodeRequired ? data.joinCode : '' }),
				...((data.systemMessages || !hideSysMes) && {
					systemMessages: hideSysMes && data.systemMessages,
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
		await Promise.all([isDirty && handleUpdateRoomData(data), changeArchiving && handleArchive()].filter(Boolean));
	});

	const formId = useUniqueId();
	const roomNameField = useUniqueId();
	const roomDescriptionField = useUniqueId();
	const roomAnnouncementField = useUniqueId();
	const roomTopicField = useUniqueId();
	const roomTypeField = useUniqueId();
	const readOnlyField = useUniqueId();
	const reactWhenReadOnlyField = useUniqueId();
	const archivedField = useUniqueId();
	const joinCodeRequiredField = useUniqueId();
	const hideSysMesField = useUniqueId();
	const encryptedField = useUniqueId();
	const retentionEnabledField = useUniqueId();
	const retentionOverrideGlobalField = useUniqueId();
	const retentionMaxAgeField = useUniqueId();
	const retentionExcludePinnedField = useUniqueId();
	const retentionFilesOnlyField = useUniqueId();

	return (
		<>
			<ContextualbarHeader>
				{onClickBack && <ContextualbarBack onClick={onClickBack} />}
				<ContextualbarTitle>{room.teamId ? t('edit-team') : t('edit-room')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent p={24}>
				<form id={formId} onSubmit={handleSubmit(handleSave)}>
					<Box display='flex' justifyContent='center'>
						<Controller
							control={control}
							name='roomAvatar'
							render={({ field: { onChange, value } }) => <RoomAvatarEditor room={room} roomAvatar={value} onChangeAvatar={onChange} />}
						/>
					</Box>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={roomNameField} required>
								{t('Name')}
							</FieldLabel>
							<FieldRow>
								<Controller
									name='roomName'
									control={control}
									rules={{ required: t('error-the-field-is-required', { field: t('Name') }) }}
									render={({ field }) => <TextInput id={roomNameField} {...field} disabled={!canViewName} />}
								/>
							</FieldRow>
							{errors.roomName && <Field.Error>{errors.roomName.message}</Field.Error>}
						</Field>
						{canViewDescription && (
							<Field>
								<FieldLabel htmlFor={roomDescriptionField}>{t('Description')}</FieldLabel>
								<FieldRow>
									<Controller
										name='roomDescription'
										control={control}
										render={({ field }) => <TextAreaInput id={roomDescriptionField} {...field} disabled={isFederated} rows={4} />}
									/>
								</FieldRow>
							</Field>
						)}
						{canViewAnnouncement && (
							<Field>
								<FieldLabel htmlFor={roomAnnouncementField}>{t('Announcement')}</FieldLabel>
								<FieldRow>
									<Controller
										name='roomAnnouncement'
										control={control}
										render={({ field }) => <TextAreaInput id={roomAnnouncementField} {...field} disabled={isFederated} rows={4} />}
									/>
								</FieldRow>
							</Field>
						)}
						{canViewTopic && (
							<Field>
								<FieldLabel htmlFor={roomTopicField}>{t('Topic')}</FieldLabel>
								<FieldRow>
									<Controller
										name='roomTopic'
										control={control}
										render={({ field }) => <TextAreaInput id={roomTopicField} {...field} rows={4} />}
									/>
								</FieldRow>
							</Field>
						)}
						{canViewType && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<FieldLabel htmlFor={roomTypeField}>{t('Private')}</FieldLabel>
									<FieldRow>
										<Controller
											control={control}
											name='roomType'
											render={({ field: { name, onBlur, onChange, value, ref } }) => (
												<ToggleSwitch
													id={roomTypeField}
													ref={ref}
													name={name}
													onBlur={onBlur}
													disabled={!canChangeType || isFederated}
													checked={value === 'p'}
													onChange={() => onChange(value === 'p' ? 'c' : 'p')}
													aria-describedby={`${roomTypeField}-hint`}
												/>
											)}
										/>
									</FieldRow>
								</Box>
								<FieldHint id={`${roomTypeField}-hint`}>{t('Teams_New_Private_Description_Enabled')}</FieldHint>
							</Field>
						)}
						{canViewReadOnly && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<FieldLabel htmlFor={readOnlyField}>{t('Read_only')}</FieldLabel>
									<FieldRow>
										<Controller
											control={control}
											name='readOnly'
											render={({ field: { value, ...field } }) => (
												<ToggleSwitch
													id={readOnlyField}
													{...field}
													checked={value}
													disabled={!canSetReadOnly || isFederated}
													aria-describedby={`${readOnlyField}-hint`}
												/>
											)}
										/>
									</FieldRow>
								</Box>
								<FieldHint id={`${readOnlyField}-hint`}>{t('Only_authorized_users_can_write_new_messages')}</FieldHint>
							</Field>
						)}
						{readOnly && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<FieldLabel htmlFor={reactWhenReadOnlyField}>{t('React_when_read_only')}</FieldLabel>
									<FieldRow>
										<Controller
											control={control}
											name='reactWhenReadOnly'
											render={({ field: { value, ...field } }) => (
												<ToggleSwitch
													id={reactWhenReadOnlyField}
													{...field}
													disabled={!canSetReactWhenReadOnly}
													checked={value}
													aria-describedby={`${reactWhenReadOnlyField}-hint`}
												/>
											)}
										/>
									</FieldRow>
								</Box>
								<FieldHint id={`${reactWhenReadOnlyField}-hint`}>{t('Only_authorized_users_can_react_to_messages')}</FieldHint>
							</Field>
						)}
						{canViewArchived && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<FieldLabel htmlFor={archivedField}>{t('Room_archivation_state_true')}</FieldLabel>
									<FieldRow>
										<Controller
											control={control}
											name='archived'
											render={({ field: { value, ...field } }) => (
												<ToggleSwitch id={archivedField} {...field} disabled={!canArchiveOrUnarchive} checked={value} />
											)}
										/>
									</FieldRow>
								</Box>
							</Field>
						)}
						{canViewJoinCode && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<FieldLabel htmlFor={joinCodeRequiredField}>{t('Password_to_access')}</FieldLabel>
									<FieldRow>
										<Controller
											control={control}
											name='joinCodeRequired'
											render={({ field: { value, ...field } }) => (
												<ToggleSwitch id={joinCodeRequiredField} {...field} disabled={isFederated} checked={value} />
											)}
										/>
									</FieldRow>
								</Box>
								<FieldRow>
									<Controller
										name='joinCode'
										control={control}
										render={({ field }) => <PasswordInput {...field} placeholder={t('Reset_password')} disabled={!joinCodeRequired} />}
									/>
								</FieldRow>
							</Field>
						)}
						{canViewHideSysMes && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<FieldLabel htmlFor={hideSysMesField}>{t('Hide_System_Messages')}</FieldLabel>
									<FieldRow>
										<Controller
											control={control}
											name='hideSysMes'
											render={({ field: { value, ...field } }) => (
												<ToggleSwitch id={hideSysMesField} {...field} checked={value} disabled={isFederated} />
											)}
										/>
									</FieldRow>
								</Box>
								<FieldRow>
									<Controller
										control={control}
										name='systemMessages'
										render={({ field }) => (
											<MultiSelect
												{...field}
												options={sysMesOptions}
												disabled={!hideSysMes || isFederated}
												placeholder={t('Select_an_option')}
											/>
										)}
									/>
								</FieldRow>
							</Field>
						)}
						{canViewEncrypted && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
									<FieldLabel htmlFor={encryptedField}>{t('Encrypted')}</FieldLabel>
									<FieldRow>
										<Controller
											control={control}
											name='encrypted'
											render={({ field: { value, ...field } }) => (
												<ToggleSwitch id={encryptedField} {...field} disabled={!canToggleEncryption || isFederated} checked={value} />
											)}
										/>
									</FieldRow>
								</Box>
							</Field>
						)}
					</FieldGroup>
					{retentionPolicy && (
						<Accordion>
							<Accordion.Item title={t('Prune')}>
								<FieldGroup>
									<Field>
										<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
											<FieldLabel htmlFor={retentionEnabledField}>{t('RetentionPolicyRoom_Enabled')}</FieldLabel>
											<FieldRow>
												<Controller
													control={control}
													name='retentionEnabled'
													render={({ field: { value, ...field } }) => (
														<ToggleSwitch id={retentionEnabledField} {...field} checked={value} />
													)}
												/>
											</FieldRow>
										</Box>
									</Field>
									<Field>
										<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
											<FieldLabel htmlFor={retentionOverrideGlobalField}>{t('RetentionPolicyRoom_OverrideGlobal')}</FieldLabel>
											<FieldRow>
												<Controller
													control={control}
													name='retentionOverrideGlobal'
													render={({ field: { value, ...field } }) => (
														<ToggleSwitch
															id={retentionOverrideGlobalField}
															{...field}
															disabled={!retentionEnabled || !canEditRoomRetentionPolicy}
															checked={value}
														/>
													)}
												/>
											</FieldRow>
										</Box>
									</Field>
									{retentionOverrideGlobal && (
										<>
											<Callout type='danger'>
												<RawText>{t('RetentionPolicyRoom_ReadTheDocs')}</RawText>
											</Callout>
											<Field>
												<FieldLabel htmlFor={retentionMaxAgeField}>{t('RetentionPolicyRoom_MaxAge', { max: retentionMaxAge })}</FieldLabel>
												<FieldRow>
													<Controller
														control={control}
														name='retentionMaxAge'
														render={({ field: { onChange, ...field } }) => (
															<NumberInput
																id={retentionMaxAgeField}
																{...field}
																onChange={(currentValue) => onChange(Math.max(1, Number(currentValue)))}
															/>
														)}
													/>
												</FieldRow>
											</Field>
											<Field>
												<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
													<FieldLabel htmlFor={retentionExcludePinnedField}>{t('RetentionPolicyRoom_ExcludePinned')}</FieldLabel>
													<FieldRow>
														<Controller
															control={control}
															name='retentionExcludePinned'
															render={({ field: { value, ...field } }) => (
																<ToggleSwitch id={retentionExcludePinnedField} {...field} checked={value} />
															)}
														/>
													</FieldRow>
												</Box>
											</Field>
											<Field>
												<Box display='flex' flexDirection='row' justifyContent='space-between' flexGrow={1}>
													<FieldLabel htmlFor={retentionFilesOnlyField}>{t('RetentionPolicyRoom_FilesOnly')}</FieldLabel>
													<FieldRow>
														<Controller
															control={control}
															name='retentionFilesOnly'
															render={({ field: { value, ...field } }) => (
																<ToggleSwitch id={retentionFilesOnlyField} {...field} checked={value} />
															)}
														/>
													</FieldRow>
												</Box>
											</Field>
										</>
									)}
								</FieldGroup>
							</Accordion.Item>
						</Accordion>
					)}
				</form>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button type='reset' disabled={!isDirty || isSubmitting} onClick={() => reset(defaultValues)}>
						{t('Reset')}
					</Button>
					<Button form={formId} type='submit' loading={isSubmitting} disabled={!isDirty}>
						{t('Save')}
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch mbs={8}>
					<Button icon='trash' danger disabled={!canDeleteRoom || isFederated || isSubmitting} onClick={handleDelete}>
						{t('Delete')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default EditRoomInfo;
