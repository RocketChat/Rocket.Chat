/* eslint-disable complexity */
import type { IRoomWithRetentionPolicy, SidepanelItem } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	FieldError,
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
	AccordionItem,
	Divider,
} from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useTranslation, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ChangeEvent } from 'react';
import { useId, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import type { EditRoomInfoFormData } from './useEditRoomInitialValues';
import { useEditRoomInitialValues } from './useEditRoomInitialValues';
import { useEditRoomPermissions } from './useEditRoomPermissions';
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
import { msToTimeUnit, TIMEUNIT } from '../../../../../lib/convertTimeUnit';
import { getDirtyFields } from '../../../../../lib/getDirtyFields';
import { useArchiveRoom } from '../../../../hooks/roomActions/useArchiveRoom';
import { useRetentionPolicy } from '../../../hooks/useRetentionPolicy';

type EditRoomInfoProps = {
	room: IRoomWithRetentionPolicy;
	onClickClose: () => void;
	onClickBack: () => void;
};

const title = {
	team: 'Edit_team' as TranslationKey,
	channel: 'Edit_channel' as TranslationKey,
	discussion: 'Edit_discussion' as TranslationKey,
};

const getRetentionSetting = (roomType: IRoomWithRetentionPolicy['t']): string => {
	switch (roomType) {
		case 'd':
			return 'RetentionPolicy_TTL_DMs';
		case 'p':
			return 'RetentionPolicy_TTL_Groups';
		case 'c':
		default:
			return 'RetentionPolicy_TTL_Channels';
	}
};

const EditRoomInfo = ({ room, onClickClose, onClickBack }: EditRoomInfoProps) => {
	const query = useQueryClient();
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const isFederated = useMemo(() => isRoomFederated(room), [room]);
	// eslint-disable-next-line no-nested-ternary
	const roomType = 'prid' in room ? 'discussion' : room.teamMain ? 'team' : 'channel';

	const retentionPolicy = useRetentionPolicy(room);
	const retentionMaxAgeDefault = msToTimeUnit(TIMEUNIT.days, useSetting(getRetentionSetting(room.t), 2592000000)) ?? 30;
	const defaultValues = useEditRoomInitialValues(room);
	const namesValidation = useSetting('UTF8_Channel_Names_Validation');
	const allowSpecialNames = useSetting('UI_Allow_room_names_with_special_chars');
	const checkTeamNameExists = useEndpoint('GET', '/v1/rooms.nameExists');

	const teamNameRegex = useMemo(() => {
		if (allowSpecialNames) {
			return null;
		}

		return new RegExp(`^${namesValidation}$`);
	}, [allowSpecialNames, namesValidation]);

	const {
		watch,
		reset,
		control,
		handleSubmit,
		getFieldState,
		formState: { isDirty, dirtyFields, errors, isSubmitting },
	} = useForm<EditRoomInfoFormData>({ mode: 'onBlur', defaultValues });

	const sysMesOptions: SelectOption[] = useMemo(
		() => MessageTypesValues.map(({ key, i18nLabel }) => [key, t(i18nLabel as TranslationKey)]),
		[t],
	);

	const { isDirty: isRoomNameDirty } = getFieldState('roomName');

	const {
		readOnly,
		archived,
		joinCodeRequired,
		hideSysMes,
		retentionEnabled,
		retentionOverrideGlobal,
		roomType: roomTypeP,
		reactWhenReadOnly,
		showChannels,
		showDiscussions,
	} = watch();

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

	const handleArchive = useArchiveRoom(room);

	// TODO: add payload validation
	const handleUpdateRoomData = useEffectEvent(
		async ({
			hideSysMes,
			joinCodeRequired,
			retentionEnabled,
			retentionOverrideGlobal,
			retentionMaxAge,
			retentionExcludePinned,
			retentionFilesOnly,
			retentionIgnoreThreads,
			...formData
		}: EditRoomInfoFormData) => {
			const data = getDirtyFields<Partial<typeof defaultValues>>(formData, dirtyFields);
			delete data.archived;
			delete data.showChannels;
			delete data.showDiscussions;

			const sidepanelItems = [showChannels && 'channels', showDiscussions && 'discussions'].filter(Boolean) as [
				SidepanelItem,
				SidepanelItem?,
			];

			const sidepanel = sidepanelItems.length > 0 ? { items: sidepanelItems } : null;

			try {
				await saveAction({
					rid: room._id,
					...data,
					...(roomType === 'team' ? { sidepanel } : null),
					...((data.joinCode || 'joinCodeRequired' in data) && { joinCode: joinCodeRequired ? data.joinCode : '' }),
					...((data.systemMessages || !hideSysMes) && {
						systemMessages: hideSysMes && data.systemMessages,
					}),
					retentionEnabled,
					retentionOverrideGlobal,
					...(retentionEnabled &&
						retentionOverrideGlobal && {
							retentionMaxAge,
							retentionExcludePinned,
							retentionFilesOnly,
							retentionIgnoreThreads,
						}),
				});

				await query.invalidateQueries({
					queryKey: ['/v1/rooms.info', room._id],
				});
				dispatchToastMessage({ type: 'success', message: t('Room_updated_successfully') });
				onClickClose();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
	);

	const handleSave = useEffectEvent((data: EditRoomInfoFormData) =>
		Promise.all([isDirty && handleUpdateRoomData(data), changeArchiving && handleArchive()].filter(Boolean)),
	);

	const validateName = async (name: string): Promise<string | undefined> => {
		if (!name || !isRoomNameDirty) return;
		if (roomType === 'discussion') return;

		if (teamNameRegex && !teamNameRegex?.test(name)) {
			return t('Name_cannot_have_special_characters');
		}

		const { exists } = await checkTeamNameExists({ roomName: name });
		if (exists) {
			return t('Teams_Errors_Already_exists', { name });
		}
	};

	const formId = useId();
	const roomNameField = useId();
	const roomDescriptionField = useId();
	const roomAnnouncementField = useId();
	const roomTopicField = useId();
	const roomTypeField = useId();
	const readOnlyField = useId();
	const reactWhenReadOnlyField = useId();
	const archivedField = useId();
	const joinCodeRequiredField = useId();
	const hideSysMesField = useId();
	const encryptedField = useId();
	const retentionEnabledField = useId();
	const retentionOverrideGlobalField = useId();
	const retentionMaxAgeField = useId();
	const retentionExcludePinnedField = useId();
	const retentionFilesOnlyField = useId();
	const retentionIgnoreThreads = useId();
	const showDiscussionsField = useId();
	const showChannelsField = useId();

	const showAdvancedSettings = canViewEncrypted || canViewReadOnly || readOnly || canViewArchived || canViewJoinCode || canViewHideSysMes;
	const showRetentionPolicy = canEditRoomRetentionPolicy && retentionPolicy?.enabled;

	const showAccordion = showAdvancedSettings || showRetentionPolicy;

	return (
		<>
			<ContextualbarHeader>
				{onClickBack && <ContextualbarBack onClick={onClickBack} />}
				<ContextualbarTitle>{t(`${title[roomType]}`)}</ContextualbarTitle>
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
									rules={{
										required: t('Required_field', { field: t('Name') }),
										validate: (value) => validateName(value),
									}}
									render={({ field }) => (
										<TextInput
											id={roomNameField}
											{...field}
											disabled={!canViewName}
											aria-invalid={errors.roomName ? 'true' : 'false'}
											aria-describedby={`${roomNameField}-error`}
											aria-required='true'
										/>
									)}
								/>
							</FieldRow>
							{errors.roomName && <FieldError id={`${roomNameField}-error`}>{errors.roomName.message}</FieldError>}
						</Field>
						{canViewTopic && (
							<Field>
								<FieldLabel htmlFor={roomTopicField}>{t('Topic')}</FieldLabel>
								<FieldRow>
									<Controller
										name='roomTopic'
										control={control}
										render={({ field }) => <TextInput id={roomTopicField} aria-describedby={`${roomTopicField}-hint`} {...field} />}
									/>
								</FieldRow>
								<FieldRow>
									<FieldHint id={`${roomTopicField}-hint`}>{t('Displayed_next_to_name')}</FieldHint>
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
										render={({ field }) => (
											<TextInput
												id={roomAnnouncementField}
												aria-describedby={`${roomAnnouncementField}-hint`}
												{...field}
												disabled={isFederated}
											/>
										)}
									/>
								</FieldRow>
								<FieldRow>
									<FieldHint id={`${roomAnnouncementField}-hint`}>{t('Information_to_keep_top_of_mind')}</FieldHint>
								</FieldRow>
							</Field>
						)}
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
						{canViewType && (
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={roomTypeField}>{t('Private')}</FieldLabel>
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
								<FieldRow>
									<FieldHint id={`${roomTypeField}-hint`}>
										{roomTypeP === 'p' ? t('Only_invited_people') : t('Anyone_can_access')}
									</FieldHint>
								</FieldRow>
							</Field>
						)}
					</FieldGroup>
					{showAccordion && (
						<Accordion>
							{showAdvancedSettings && (
								<AccordionItem title={t('Advanced_settings')}>
									{roomType === 'team' && (
										<FeaturePreview feature='sidepanelNavigation'>
											<FeaturePreviewOff>{null}</FeaturePreviewOff>
											<FeaturePreviewOn>
												<FieldGroup>
													<Box is='h5' fontScale='h5' color='titles-labels'>
														{t('Navigation')}
													</Box>
													<Field>
														<FieldRow>
															<FieldLabel htmlFor={showChannelsField}>{t('Channels')}</FieldLabel>
															<Controller
																control={control}
																name='showChannels'
																render={({ field: { value, ...field } }) => (
																	<ToggleSwitch id={showChannelsField} checked={value} {...field} />
																)}
															/>
														</FieldRow>
														<FieldRow>
															<FieldHint id={`${showChannelsField}-hint`}>{t('Show_channels_description')}</FieldHint>
														</FieldRow>
													</Field>
													<Field>
														<FieldRow>
															<FieldLabel htmlFor={showDiscussionsField}>{t('Discussions')}</FieldLabel>
															<Controller
																control={control}
																name='showDiscussions'
																render={({ field: { value, ...field } }) => (
																	<ToggleSwitch id={showDiscussionsField} checked={value} {...field} />
																)}
															/>
														</FieldRow>
														<FieldRow>
															<FieldHint id={`${showDiscussionsField}-hint`}>{t('Show_discussions_description')}</FieldHint>
														</FieldRow>
													</Field>
												</FieldGroup>
												<Divider mb={24} />
											</FeaturePreviewOn>
										</FeaturePreview>
									)}
									<FieldGroup>
										<Box is='h5' fontScale='h5' color='titles-labels'>
											{t('Security_and_permissions')}
										</Box>
										{canViewEncrypted && (
											<Field>
												<FieldRow>
													<FieldLabel htmlFor={encryptedField}>{t('Encrypted')}</FieldLabel>
													<Controller
														control={control}
														name='encrypted'
														render={({ field: { value, ...field } }) => (
															<ToggleSwitch
																id={encryptedField}
																aria-describedby={`${encryptedField}-hint`}
																{...field}
																disabled={!canToggleEncryption || isFederated}
																checked={value}
															/>
														)}
													/>
												</FieldRow>
												<FieldRow>
													<FieldHint id={`${encryptedField}-hint`}>{t('Encrypted_field_hint')}</FieldHint>
												</FieldRow>
											</Field>
										)}
										{canViewReadOnly && (
											<Field>
												<FieldRow>
													<FieldLabel htmlFor={readOnlyField}>{t('Read_only')}</FieldLabel>
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
												<FieldHint id={`${readOnlyField}-hint`}>
													{readOnly ? t('Read_only_field_hint_enabled', { roomType }) : t('Read_only_field_hint_disabled')}
												</FieldHint>
											</Field>
										)}
										{readOnly && (
											<Field>
												<FieldRow>
													<FieldLabel htmlFor={reactWhenReadOnlyField}>{t('React_when_read_only')}</FieldLabel>
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
												<FieldRow>
													<FieldHint id={`${reactWhenReadOnlyField}-hint`}>
														{reactWhenReadOnly ? t('Anyone_can_react_to_messages') : t('Only_authorized_users_can_react_to_messages')}
													</FieldHint>
												</FieldRow>
											</Field>
										)}
										{canViewArchived && (
											<Field>
												<FieldRow>
													<FieldLabel htmlFor={archivedField}>{t('Room_archivation_state_true')}</FieldLabel>
													<Controller
														control={control}
														name='archived'
														render={({ field: { value, ...field } }) => (
															<ToggleSwitch
																id={archivedField}
																aria-describedby={`${archivedField}-hint`}
																{...field}
																disabled={!canArchiveOrUnarchive}
																checked={value}
															/>
														)}
													/>
												</FieldRow>
												{archived && (
													<FieldRow>
														<FieldHint id={`${archivedField}-hint`}>{t('New_messages_cannot_be_sent')}</FieldHint>
													</FieldRow>
												)}
											</Field>
										)}
										{canViewJoinCode && (
											<Field>
												<FieldRow>
													<FieldLabel htmlFor={joinCodeRequiredField}>{t('Password_to_access')}</FieldLabel>
													<Controller
														control={control}
														name='joinCodeRequired'
														render={({ field: { value, ...field } }) => (
															<ToggleSwitch id={joinCodeRequiredField} {...field} disabled={isFederated} checked={value} />
														)}
													/>
												</FieldRow>
												{joinCodeRequired && (
													<FieldRow>
														<Controller
															name='joinCode'
															control={control}
															render={({ field }) => (
																<PasswordInput {...field} placeholder={t('Reset_password')} disabled={!joinCodeRequired} />
															)}
														/>
													</FieldRow>
												)}
											</Field>
										)}
										{canViewHideSysMes && (
											<Field>
												<FieldRow>
													<FieldLabel htmlFor={hideSysMesField}>{t('Hide_System_Messages')}</FieldLabel>
													<Controller
														control={control}
														name='hideSysMes'
														render={({ field: { value, ...field } }) => (
															<ToggleSwitch id={hideSysMesField} {...field} checked={value} disabled={isFederated} />
														)}
													/>
												</FieldRow>
												<FieldRow>
													<Controller
														control={control}
														name='systemMessages'
														render={({ field }) => (
															<MultiSelect
																{...field}
																options={sysMesOptions}
																disabled={!hideSysMes || isFederated}
																placeholder={t('Select_messages_to_hide')}
															/>
														)}
													/>
												</FieldRow>
											</Field>
										)}
									</FieldGroup>
								</AccordionItem>
							)}
							{showRetentionPolicy && (
								<AccordionItem title={t('Prune')}>
									<FieldGroup>
										<Field>
											<FieldRow>
												<FieldLabel htmlFor={retentionEnabledField}>{t('RetentionPolicyRoom_Enabled')}</FieldLabel>
												<Controller
													control={control}
													name='retentionEnabled'
													render={({ field: { value, ...field } }) => (
														<ToggleSwitch id={retentionEnabledField} {...field} checked={value} />
													)}
												/>
											</FieldRow>
										</Field>
										<Field>
											<FieldRow>
												<FieldLabel htmlFor={retentionOverrideGlobalField}>{t('RetentionPolicyRoom_OverrideGlobal')}</FieldLabel>
												<Controller
													control={control}
													name='retentionOverrideGlobal'
													render={({ field: { value, ...field } }) => (
														<ToggleSwitch id={retentionOverrideGlobalField} {...field} disabled={!retentionEnabled} checked={value} />
													)}
												/>
											</FieldRow>
										</Field>
										{retentionOverrideGlobal && (
											<>
												<Callout type='danger'>
													<RawText>{t('RetentionPolicyRoom_ReadTheDocs')}</RawText>
												</Callout>
												<Field>
													<FieldLabel htmlFor={retentionMaxAgeField}>
														{t('RetentionPolicyRoom_MaxAge', { max: retentionMaxAgeDefault })}
													</FieldLabel>
													<FieldRow>
														<Controller
															control={control}
															name='retentionMaxAge'
															render={({ field: { onChange, ...field } }) => (
																<NumberInput
																	id={retentionMaxAgeField}
																	{...field}
																	onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.currentTarget.value))}
																/>
															)}
														/>
													</FieldRow>
												</Field>
												<Field>
													<FieldRow>
														<FieldLabel htmlFor={retentionExcludePinnedField}>{t('RetentionPolicyRoom_ExcludePinned')}</FieldLabel>
														<Controller
															control={control}
															name='retentionExcludePinned'
															render={({ field: { value, ...field } }) => (
																<ToggleSwitch id={retentionExcludePinnedField} {...field} checked={value} />
															)}
														/>
													</FieldRow>
												</Field>
												<Field>
													<FieldRow>
														<FieldLabel htmlFor={retentionFilesOnlyField}>{t('RetentionPolicyRoom_FilesOnly')}</FieldLabel>
														<Controller
															control={control}
															name='retentionFilesOnly'
															render={({ field: { value, ...field } }) => (
																<ToggleSwitch id={retentionFilesOnlyField} {...field} checked={value} />
															)}
														/>
													</FieldRow>
												</Field>
												<Field>
													<FieldRow>
														<FieldLabel htmlFor={retentionIgnoreThreads}>{t('RetentionPolicy_DoNotPruneThreads')}</FieldLabel>
														<Controller
															control={control}
															name='retentionIgnoreThreads'
															render={({ field: { value, ...field } }) => (
																<ToggleSwitch id={retentionIgnoreThreads} {...field} checked={value} />
															)}
														/>
													</FieldRow>
												</Field>
											</>
										)}
									</FieldGroup>
								</AccordionItem>
							)}
						</Accordion>
					)}
				</form>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button type='reset' disabled={!isDirty || isSubmitting} onClick={() => reset(defaultValues)}>
						{t('Reset')}
					</Button>
					<Button form={formId} type='submit' primary loading={isSubmitting} disabled={!isDirty}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default EditRoomInfo;
