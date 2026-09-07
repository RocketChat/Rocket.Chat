import {
	Box,
	Button,
	Callout,
	Icon,
	Modal,
	Accordion,
	AccordionItem,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import { TextInput, ToggleSwitch, Field, FieldGroup, FieldLabel, FieldRow, FieldError, FieldHint } from '@rocket.chat/fuselage-forms';
import {
	useEndpoint,
	usePermission,
	usePermissionWithScopedRoles,
	useSetting,
	useToastMessageDispatch,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useId, memo, useEffect, useMemo, useState } from 'react';
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form';

import { useEncryptedRoomDescription } from './useEncryptedRoomDescription';
import AbacCreationAttributeStep from '../../../components/ABAC/AbacCreationAttributeStep';
import AbacMembershipPreview from '../../../components/ABAC/AbacMembershipPreview/AbacMembershipPreview';
import { useAbacMembershipPreview } from '../../../components/ABAC/AbacMembershipPreview/useAbacMembershipPreview';
import { useAbacAssignabilityBlock } from '../../../components/ABAC/useAbacAssignabilityBlock';
import { useAbacAttributeMap } from '../../../components/ABAC/useAbacAttributeMap';
import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';
import { useCreateChannelTypePermission } from '../../../hooks/useCreateChannelTypePermission';
import { useIsABACAvailable } from '../../../views/admin/ABAC/hooks/useIsABACAvailable';
import { useIsAbacEnforcementOn } from '../../../views/admin/ABAC/hooks/useIsAbacEnforcementOn';
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
	attributes: { key: string; values: string[] }[];
};

const TOTAL_ABAC_STEPS = 4;

export type CreateTeamModalProps = { onClose: () => void; onSuccess?: (rid: string) => void | Promise<void> };

const CreateTeamModal = ({ onClose, onSuccess }: CreateTeamModalProps) => {
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

	// ABAC-P4 — a team's main room is a room like any other, so it follows the same stepped flow as
	// a channel. Creating one without attributes under enforcement is refused server-side either
	// way; this is what lets the user supply them.
	const isAbacAvailable = useIsABACAvailable();
	const abacEnforcementOn = useIsAbacEnforcementOn();
	const requiredAttributeKeys = useSetting<string[]>('ABAC_Required_Attributes', []) ?? [];
	const checkAssignability = useEndpoint('POST', '/v1/abac/attribute-assignability');

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
			// Enforcement locks ABAC-managed on, so the flow starts there.
			isAbacManaged: isAbacAvailable && abacEnforcementOn,
			// Workspace-required attributes are pre-filled and cannot be removed.
			attributes: requiredAttributeKeys.map((key) => ({ key, values: [] })),
		},
	});

	const {
		control,
		handleSubmit,
		setValue,
		watch,
		trigger,
		formState: { errors, isSubmitting },
	} = methods;

	const { isPrivate, broadcast, readOnly, encrypted, isAbacManaged, members } = watch();

	const { fields, append, remove } = useFieldArray({ control, name: 'attributes' });
	const attributeMap = useAbacAttributeMap(control);
	const assignability = useAbacAssignabilityBlock(requiredAttributeKeys);

	const isStepped = isAbacAvailable && isAbacManaged;
	const [step, setStep] = useState(1);
	const [pdpDenial, setPdpDenial] = useState<string | undefined>();

	const {
		data: compliance,
		isPending: isCompliancePending,
		error: complianceError,
	} = useAbacMembershipPreview({
		// The creator is a member of the team they create, so they are evaluated too.
		target: { memberUsernames: members ?? [] },
		attributes: attributeMap,
		enabled: isStepped && step === TOTAL_ABAC_STEPS,
	});

	const noCompliantMembers = Boolean(compliance) && compliance?.counts.retaining === 0;

	useEffect(() => {
		if (!isPrivate) {
			setValue('encrypted', false);
		} else if (e2eEnforcedForPrivate) {
			setValue('encrypted', true);
		}

		setValue('readOnly', broadcast);
	}, [watch, setValue, broadcast, isPrivate, e2eEnforcedForPrivate]);

	// The licence lookup behind `isAbacAvailable` resolves after the first render, so the default
	// above can be computed while it is still false. Enforcement has to win once it is known, or
	// the flow silently degrades to the unstepped form and the server refuses the creation with no
	// explanation (ABAC-P4 QA).
	useEffect(() => {
		if (isAbacAvailable && abacEnforcementOn) {
			setValue('isAbacManaged', true);
		}
	}, [isAbacAvailable, abacEnforcementOn, setValue]);

	// An ABAC-managed room is private by definition (ABAC-P4 M2 switch interlocks).
	useEffect(() => {
		if (isAbacManaged) {
			setValue('isPrivate', true);
		}
	}, [isAbacManaged, setValue]);

	// Turning ABAC-managed off collapses the flow, so the user must not be left on a step that no
	// longer exists.
	useEffect(() => {
		if (!isStepped) {
			setStep(1);
		}
	}, [isStepped]);

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
		isAbacManaged,
	}: CreateTeamModalInputs): Promise<void> => {
		const params = {
			name,
			members,
			type: isPrivate ? 1 : 0,
			// ABAC-P4 — attributes travel with the creation call so the team's main room is never
			// briefly locked, and the creator's authority to instantiate them is validated before
			// the insert.
			...(isAbacManaged && Object.keys(attributeMap).length ? { abacAttributes: attributeMap } : {}),
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
			goToRoom(team.roomId);
			void onSuccess?.(team.roomId);
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleNext = async () => {
		setPdpDenial(undefined);

		if (step === 1) {
			if (!(await trigger(['name', 'members']))) {
				return;
			}
			setStep(2);
			return;
		}

		if (step === 2) {
			if (assignability.isBlocked) {
				return;
			}

			if (!(await trigger('attributes'))) {
				return;
			}

			// The PDP decides whether this actor may instantiate this combination, and it is asked
			// before anything is created so a denial does not leave a locked team behind.
			try {
				await checkAssignability({ attributes: attributeMap });
			} catch (error) {
				const details = (error as { details?: { key?: string; values?: string[] } })?.details;
				setPdpDenial(
					details?.key
						? t('ABAC_Attribute_not_assignable', { key: details.key, values: (details.values ?? []).join(', ') })
						: t('ABAC_Attributes_not_assignable'),
				);
				return;
			}

			setStep(3);
			return;
		}

		if (step === 3) {
			setStep(4);
		}
	};

	const showTeamFields = !isStepped || step === 1;
	const showAttributeFields = isStepped && step === 2;
	const showSecurityFields = !isStepped || step === 3;
	const showCompliance = isStepped && step === TOTAL_ABAC_STEPS;

	const createTeamFormId = useId();

	return (
		<FormProvider {...methods}>
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
				<ModalContent marginBlockEnd={2}>
					<Box fontScale='p2' marginBlockEnd={16}>
						{t('Teams_new_description')}
					</Box>
					{showTeamFields && (
						<FieldGroup marginBlockEnd={24}>
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
												endAddon={<Icon size='x20' name={isPrivate ? 'team-lock' : 'team'} />}
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
							<Field>
								<FieldRow>
									<FieldLabel>{t('Teams_New_Private_Label')}</FieldLabel>
									<Controller
										control={control}
										name='isPrivate'
										render={({ field: { onChange, value, ref } }) => (
											<ToggleSwitch
												onChange={onChange}
												checked={canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : value}
												disabled={!!canOnlyCreateOneType}
												ref={ref}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint>{isPrivate ? t('People_can_only_join_by_being_invited') : t('Anyone_can_access')}</FieldHint>
							</Field>
							{isAbacAvailable && (
								<Field>
									<FieldRow>
										<FieldLabel>{t('ABAC_Managed')}</FieldLabel>
										<Controller
											control={control}
											name='isAbacManaged'
											render={({ field: { value, ...field } }) => (
												// Enforcement locks this on: every room must be ABAC-managed (D6).
												<ToggleSwitch {...field} checked={value} disabled={abacEnforcementOn} />
											)}
										/>
									</FieldRow>
									<FieldHint>{t('ABAC_Restricts_access_to_compliant_users')}</FieldHint>
								</Field>
							)}
						</FieldGroup>
					)}

					{showAttributeFields && (
						<AbacCreationAttributeStep
							fields={fields}
							append={() => append({ key: '', values: [] })}
							remove={remove}
							requiredAttributeKeys={requiredAttributeKeys}
							pdpDenial={pdpDenial}
							blockedReason={assignability.reason}
						/>
					)}

					{showCompliance && (
						<>
							{noCompliantMembers && (
								<Callout type='danger' marginBlockEnd={16}>
									{t('ABAC_Cannot_create_room_with_no_compliant_members')}
								</Callout>
							)}
							<AbacMembershipPreview
								variant='compliance'
								data={compliance}
								isPending={isCompliancePending}
								error={complianceError ?? undefined}
							/>
						</>
					)}

					{showSecurityFields && (
						<Accordion>
							<AccordionItem title={t('Advanced_settings')}>
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
										<FieldHint>
											{readOnly ? t('Read_only_field_hint_enabled', { roomType: 'team' }) : t('Anyone_can_send_new_messages')}
										</FieldHint>
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
							</AccordionItem>
						</Accordion>
					)}
				</ModalContent>
				<ModalFooter>
					{isStepped && (
						<Box flexGrow={1} fontScale='c1' color='hint'>
							{t('ABAC_Step_n_of_m', { step, total: TOTAL_ABAC_STEPS })}
						</Box>
					)}
					<ModalFooterControllers>
						{isStepped && step > 1 ? (
							<Button onClick={() => setStep(step - 1)}>{t('Back')}</Button>
						) : (
							<Button onClick={onClose}>{t('Cancel')}</Button>
						)}
						{isStepped && step < TOTAL_ABAC_STEPS ? (
							<Button primary onClick={handleNext} disabled={showAttributeFields && assignability.isBlocked}>
								{t('Next')}
							</Button>
						) : (
							<Button
								disabled={!canCreateTeam || (showCompliance && (noCompliantMembers || isCompliancePending))}
								loading={isSubmitting}
								type='submit'
								primary
							>
								{t('Create')}
							</Button>
						)}
					</ModalFooterControllers>
				</ModalFooter>
			</Modal>
		</FormProvider>
	);
};

export default memo(CreateTeamModal);
