import {
	Box,
	Button,
	Field,
	Icon,
	Modal,
	TextInput,
	ToggleSwitch,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldError,
	FieldHint,
	Accordion,
	AccordionItem,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import {
	useEndpoint,
	usePermission,
	usePermissionWithScopedRoles,
	useSetting,
	useToastMessageDispatch,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { useId, memo, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useEncryptedRoomDescription } from './useEncryptedRoomDescription';
import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';
import { useCreateChannelTypePermission } from '../../../hooks/useCreateChannelTypePermission';
import { goToRoomById } from '../../../lib/utils/goToRoomById';

type CreateTeamModalInputs = {
	name: string;
	topic: string;
	isPrivate: boolean;
	readOnly: boolean;
	encrypted: boolean;
	broadcast: boolean;
	members?: string[];
};

type CreateTeamModalProps = { onClose: () => void };

const CreateTeamModal = ({ onClose }: CreateTeamModalProps) => {
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	const e2eEnabledForPrivateByDefault = useSetting('E2E_Enabled_Default_PrivateRooms') && e2eEnabled;
	const namesValidation = useSetting('UTF8_Channel_Names_Validation');
	const allowSpecialNames = useSetting('UI_Allow_room_names_with_special_chars');
	const canSetReadOnly = usePermissionWithScopedRoles('set-readonly', ['owner']);

	const dispatchToastMessage = useToastMessageDispatch();
	const canCreateTeam = usePermission('create-team');

	const checkTeamNameExists = useEndpoint('GET', '/v1/rooms.nameExists');
	const createTeamAction = useEndpoint('POST', '/v1/teams.create');

	const teamNameRegex = useMemo(() => {
		if (allowSpecialNames) {
			return null;
		}

		return new RegExp(`^${namesValidation}$`);
	}, [allowSpecialNames, namesValidation]);

	const canOnlyCreateOneType = useCreateChannelTypePermission();

	const validateTeamName = async (name: string): Promise<string | undefined> => {
		if (!name) {
			return;
		}

		if (teamNameRegex && !teamNameRegex?.test(name)) {
			return t('Name_cannot_have_special_characters');
		}

		const { exists } = await checkTeamNameExists({ roomName: name });
		if (exists) {
			return t('Teams_Errors_Already_exists', { name });
		}
	};

	const {
		register,
		control,
		handleSubmit,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<CreateTeamModalInputs>({
		defaultValues: {
			isPrivate: canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : true,
			readOnly: false,
			encrypted: (e2eEnabledForPrivateByDefault as boolean) ?? false,
			broadcast: false,
			members: [],
		},
	});

	const { isPrivate, broadcast, readOnly, encrypted } = watch();

	useEffect(() => {
		if (!isPrivate) {
			setValue('encrypted', false);
		}

		setValue('readOnly', broadcast);
	}, [watch, setValue, broadcast, isPrivate]);

	const readOnlyDisabled = broadcast || !canSetReadOnly;
	const canChangeEncrypted = isPrivate && e2eEnabled;
	const getEncryptedHint = useEncryptedRoomDescription('team');

	const handleCreateTeam = async ({
		name,
		members,
		isPrivate,
		readOnly,
		topic,
		broadcast,
		encrypted,
	}: CreateTeamModalInputs): Promise<void> => {
		const params = {
			name,
			members,
			type: isPrivate ? 1 : 0,
			room: {
				readOnly,
				extraData: {
					topic,
					broadcast,
					encrypted,
				},
			},
		};

		try {
			const { team } = await createTeamAction(params);
			dispatchToastMessage({ type: 'success', message: t('Team_has_been_created') });
			goToRoomById(team.roomId);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onClose();
		}
	};

	const createTeamFormId = useId();
	const nameId = useId();
	const topicId = useId();
	const privateId = useId();
	const readOnlyId = useId();
	const encryptedId = useId();
	const broadcastId = useId();
	const addMembersId = useId();

	return (
		<Modal
			aria-labelledby={`${createTeamFormId}-title`}
			wrapperFunction={(props: ComponentProps<typeof Box>) => (
				<Box is='form' id={createTeamFormId} onSubmit={handleSubmit(handleCreateTeam)} {...props} />
			)}
		>
			<ModalHeader>
				<ModalTitle id={`${createTeamFormId}-title`}>{t('Teams_New_Title')}</ModalTitle>
				<ModalClose title={t('Close')} onClick={onClose} tabIndex={-1} />
			</ModalHeader>
			<ModalContent mbe={2}>
				<Box fontScale='p2' mbe={16}>
					{t('Teams_new_description')}
				</Box>
				<FieldGroup mbe={24}>
					<Field>
						<FieldLabel required htmlFor={nameId}>
							{t('Teams_New_Name_Label')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								id={nameId}
								aria-invalid={errors.name ? 'true' : 'false'}
								{...register('name', {
									required: t('Required_field', { field: t('Name') }),
									validate: (value) => validateTeamName(value),
								})}
								addon={<Icon size='x20' name={isPrivate ? 'team-lock' : 'team'} />}
								error={errors.name?.message}
								aria-describedby={`${nameId}-error ${nameId}-hint`}
								aria-required='true'
							/>
						</FieldRow>
						{errors?.name && (
							<FieldError aria-live='assertive' id={`${nameId}-error`}>
								{errors.name.message}
							</FieldError>
						)}
						{!allowSpecialNames && <FieldHint id={`${nameId}-hint`}>{t('No_spaces_or_special_characters')}</FieldHint>}
					</Field>
					<Field>
						<FieldLabel htmlFor={topicId}>{t('Topic')}</FieldLabel>
						<FieldRow>
							<TextInput id={topicId} aria-describedby={`${topicId}-hint`} {...register('topic')} />
						</FieldRow>
						<FieldRow>
							<FieldHint id={`${topicId}-hint`}>{t('Displayed_next_to_name')}</FieldHint>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={addMembersId}>{t('Teams_New_Add_members_Label')}</FieldLabel>
						<Controller
							control={control}
							name='members'
							render={({ field: { onChange, value } }): ReactElement => (
								<UserAutoCompleteMultiple id={addMembersId} value={value} onChange={onChange} placeholder={t('Add_people')} />
							)}
						/>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={privateId}>{t('Teams_New_Private_Label')}</FieldLabel>
							<Controller
								control={control}
								name='isPrivate'
								render={({ field: { onChange, value, ref } }): ReactElement => (
									<ToggleSwitch
										id={privateId}
										aria-describedby={`${privateId}-hint`}
										onChange={onChange}
										checked={canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : value}
										disabled={!!canOnlyCreateOneType}
										ref={ref}
									/>
								)}
							/>
						</FieldRow>
						<FieldHint id={`${privateId}-hint`}>
							{isPrivate ? t('People_can_only_join_by_being_invited') : t('Anyone_can_access')}
						</FieldHint>
					</Field>
				</FieldGroup>
				<Accordion>
					<AccordionItem title={t('Advanced_settings')}>
						<FieldGroup>
							<Box is='h5' fontScale='h5' color='titles-labels'>
								{t('Security_and_permissions')}
							</Box>
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={encryptedId}>{t('Teams_New_Encrypted_Label')}</FieldLabel>
									<Controller
										control={control}
										name='encrypted'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch
												id={encryptedId}
												disabled={!canChangeEncrypted}
												onChange={onChange}
												aria-describedby={`${encryptedId}-hint`}
												checked={value}
												ref={ref}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint id={`${encryptedId}-hint`}>{getEncryptedHint({ isPrivate, encrypted })}</FieldHint>
							</Field>
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={readOnlyId}>{t('Teams_New_Read_only_Label')}</FieldLabel>
									<Controller
										control={control}
										name='readOnly'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch
												id={readOnlyId}
												aria-describedby={`${readOnlyId}-hint`}
												disabled={readOnlyDisabled}
												onChange={onChange}
												checked={value}
												ref={ref}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint id={`${readOnlyId}-hint`}>
									{readOnly ? t('Read_only_field_hint_enabled', { roomType: 'team' }) : t('Anyone_can_send_new_messages')}
								</FieldHint>
							</Field>
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={broadcastId}>{t('Teams_New_Broadcast_Label')}</FieldLabel>
									<Controller
										control={control}
										name='broadcast'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch
												aria-describedby={`${broadcastId}-hint`}
												id={broadcastId}
												onChange={onChange}
												checked={value}
												ref={ref}
											/>
										)}
									/>
								</FieldRow>
								{broadcast && <FieldHint id={`${broadcastId}-hint`}>{t('Teams_New_Broadcast_Description')}</FieldHint>}
							</Field>
						</FieldGroup>
					</AccordionItem>
				</Accordion>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!canCreateTeam} loading={isSubmitting} type='submit' primary>
						{t('Create')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default memo(CreateTeamModal);
