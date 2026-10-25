import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Box, Icon, Modal, Callout, ModalHeader, ModalTitle, ModalClose } from '@rocket.chat/fuselage';
import { TextInput, ToggleSwitch, Field, FieldGroup, FieldLabel, FieldRow, FieldError, FieldHint } from '@rocket.chat/fuselage-forms';
import type { TeamsCreateProps } from '@rocket.chat/rest-typings';
import {
	useEndpoint,
	usePermission,
	usePermissionWithScopedRoles,
	useSetting,
	useToastMessageDispatch,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useId, memo, useEffect, useMemo } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';

import { useEncryptedRoomDescription } from './useEncryptedRoomDescription';
import type { AbacRoomCreation } from '../../../components/ABAC/AbacRoomCreation';
import {
	AbacManagedField,
	CreateRoomSteps,
	getInitialAbacAttributes,
	isAbacCreationBlocked,
	useAbacCreationFlow,
} from '../../../components/ABAC/AbacRoomCreation';
import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';
import { useCreateChannelTypePermission } from '../../../hooks/useCreateChannelTypePermission';
import { useGoToRoom } from '../../../views/room/hooks/useGoToRoom';

type CreateTeamModalInputs = {
	name: string;
	topic: string;
	isPrivate: boolean;
	readOnly: boolean;
	encrypted: boolean;
	broadcast: boolean;
	members?: string[];
	isAbacManaged: boolean;
	attributes: IAbacAttributeDefinition[];
};

export type CreateTeamModalProps = { onClose: () => void; onSuccess?: (rid: string) => void | Promise<void>; abac?: AbacRoomCreation };

const getNameIcon = (isAbacManaged: boolean, isPrivate: boolean): ComponentProps<typeof Icon>['name'] => {
	if (isAbacManaged) {
		return 'team-shield';
	}

	return isPrivate ? 'team-lock' : 'team';
};

const CreateTeamModal = ({ onClose, onSuccess, abac }: CreateTeamModalProps) => {
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	const e2eEnabledForPrivateByDefault = useSetting('E2E_Enabled_Default_PrivateRooms') && e2eEnabled;
	const e2eEnforcedForPrivate = Boolean(useSetting('E2E_Force_Encryption_For_Private_Rooms')) && Boolean(e2eEnabled);
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
	const canCreatePrivate = canOnlyCreateOneType !== 'c';
	const creationBlocked = isAbacCreationBlocked(abac, canCreatePrivate);

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

	const methods = useForm<CreateTeamModalInputs>({
		defaultValues: {
			name: '',
			topic: '',
			isPrivate: canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : true,
			readOnly: false,
			encrypted: Boolean(e2eEnforcedForPrivate || e2eEnabledForPrivateByDefault),
			broadcast: false,
			members: [],
			isAbacManaged: Boolean(abac?.enforced),
			attributes: getInitialAbacAttributes(abac),
		},
	});

	const {
		control,
		handleSubmit,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = methods;

	const { isPrivate, broadcast, readOnly, encrypted, isAbacManaged, members = [], attributes } = watch();

	const abacFlow = useAbacCreationFlow({ abac, isAbacManaged, members, attributes });

	useEffect(() => {
		if (isAbacManaged) {
			setValue('isPrivate', true);
		} else if (canOnlyCreateOneType) {
			setValue('isPrivate', canOnlyCreateOneType === 'p');
		}
	}, [isAbacManaged, canOnlyCreateOneType, setValue]);

	useEffect(() => {
		if (!isPrivate) {
			setValue('encrypted', false);
		} else if (e2eEnforcedForPrivate) {
			setValue('encrypted', true);
		}

		setValue('readOnly', broadcast);
	}, [watch, setValue, broadcast, isPrivate, e2eEnforcedForPrivate]);

	const readOnlyDisabled = broadcast || !canSetReadOnly;
	const canChangeEncrypted = isPrivate && e2eEnabled && !e2eEnforcedForPrivate;
	const getEncryptedHint = useEncryptedRoomDescription('team');

	const goToRoom = useGoToRoom();

	const handleCreateTeam = async ({
		name,
		members,
		isPrivate,
		readOnly,
		topic,
		broadcast,
		encrypted,
	}: CreateTeamModalInputs): Promise<void> => {
		const params: TeamsCreateProps = {
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
			...(abacFlow.isManaged && { abacAttributes: abacFlow.attributeMap }),
		};

		try {
			const { team, skippedMembers } = await createTeamAction(params);
			dispatchToastMessage({ type: 'success', message: t('Team_has_been_created') });
			if (skippedMembers?.length) {
				dispatchToastMessage({ type: 'info', message: t('ABAC_Members_Not_Added', { count: skippedMembers.length }) });
			}
			goToRoom(team.roomId);
			void onSuccess?.(team.roomId);
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleStepSubmit = handleSubmit((data) => abacFlow.submitStep(() => handleCreateTeam(data)));

	const createTeamFormId = useId();

	const securityFields = (
		<FieldGroup>
			<Box is='h5' fontScale='h5' color='titles-labels'>
				{t('Security_and_permissions')}
			</Box>
			<Field>
				<FieldRow>
					<FieldLabel>{t('Teams_New_Encrypted_Label')}</FieldLabel>
					<Controller
						control={control}
						name='encrypted'
						render={({ field: { onChange, value, ref } }) => (
							<ToggleSwitch disabled={!canChangeEncrypted} onChange={onChange} checked={value} ref={ref} />
						)}
					/>
				</FieldRow>
				<FieldHint>{getEncryptedHint({ isPrivate, encrypted })}</FieldHint>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel>{t('Teams_New_Read_only_Label')}</FieldLabel>
					<Controller
						control={control}
						name='readOnly'
						render={({ field: { onChange, value, ref } }) => (
							<ToggleSwitch disabled={readOnlyDisabled} onChange={onChange} checked={value} ref={ref} />
						)}
					/>
				</FieldRow>
				<FieldHint>{readOnly ? t('Read_only_field_hint_enabled', { roomType: 'team' }) : t('Anyone_can_send_new_messages')}</FieldHint>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel>{t('Teams_New_Broadcast_Label')}</FieldLabel>
					<Controller
						control={control}
						name='broadcast'
						render={({ field: { onChange, value, ref } }) => <ToggleSwitch onChange={onChange} checked={value} ref={ref} />}
					/>
				</FieldRow>
				{broadcast && <FieldHint>{t('Teams_New_Broadcast_Description')}</FieldHint>}
			</Field>
		</FieldGroup>
	);

	return (
		<FormProvider {...methods}>
			<Modal
				aria-labelledby={`${createTeamFormId}-title`}
				wrapperFunction={(props: ComponentProps<typeof Box>) => (
					<Box is='form' id={createTeamFormId} onSubmit={handleStepSubmit} {...props} />
				)}
			>
				<ModalHeader>
					<ModalTitle id={`${createTeamFormId}-title`}>{t('Teams_New_Title')}</ModalTitle>
					<ModalClose title={t('Close')} onClick={onClose} tabIndex={-1} />
				</ModalHeader>
				<CreateRoomSteps
					abac={abac}
					flow={abacFlow}
					security={securityFields}
					onCancel={onClose}
					submitDisabled={!canCreateTeam || creationBlocked}
					isSubmitting={isSubmitting}
					details={
						<Box display='flex' flexDirection='column' gap={16} marginBlockEnd={24}>
							<Box fontScale='p2'>{t('Teams_new_description')}</Box>
							{creationBlocked && <Callout type='danger'>{t('ABAC_Room_Creation_Not_Allowed')}</Callout>}
							<FieldGroup>
								<Field>
									<FieldLabel required>{t('Teams_New_Name_Label')}</FieldLabel>
									<FieldRow>
										<Controller
											control={control}
											name='name'
											rules={{
												required: t('Required_field', { field: t('Name') }),
												validate: (value) => validateTeamName(value),
											}}
											render={({ field }) => (
												<TextInput
													{...field}
													endAddon={<Icon size='x20' name={getNameIcon(abacFlow.isManaged, isPrivate)} />}
													error={errors.name?.message}
													aria-required='true'
												/>
											)}
										/>
									</FieldRow>
									{errors?.name && <FieldError>{errors.name.message}</FieldError>}
									{!allowSpecialNames && <FieldHint>{t('No_spaces_or_special_characters')}</FieldHint>}
								</Field>
								<Field>
									<FieldLabel>{t('Topic')}</FieldLabel>
									<FieldRow>
										<Controller control={control} name='topic' render={({ field }) => <TextInput {...field} />} />
									</FieldRow>
									<FieldRow>
										<FieldHint>{t('Displayed_next_to_name')}</FieldHint>
									</FieldRow>
								</Field>
								<Field>
									<FieldLabel>{t('Teams_New_Add_members_Label')}</FieldLabel>
									<Controller
										control={control}
										name='members'
										render={({ field: { onChange, value } }) => (
											<UserAutoCompleteMultiple value={value} onChange={onChange} placeholder={t('Add_people')} />
										)}
									/>
								</Field>
								{abac && <AbacManagedField abac={abac} canCreatePrivate={canCreatePrivate} />}
								<Field>
									<FieldRow>
										<FieldLabel>{t('Teams_New_Private_Label')}</FieldLabel>
										<Controller
											control={control}
											name='isPrivate'
											render={({ field: { onChange, value, ref } }) => (
												<ToggleSwitch
													onChange={onChange}
													checked={isAbacManaged || (canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : value)}
													disabled={isAbacManaged || !!canOnlyCreateOneType}
													ref={ref}
												/>
											)}
										/>
									</FieldRow>
									<FieldHint>{isPrivate ? t('People_can_only_join_by_being_invited') : t('Anyone_can_access')}</FieldHint>
								</Field>
							</FieldGroup>
						</Box>
					}
				/>
			</Modal>
		</FormProvider>
	);
};

export default memo(CreateTeamModal);
