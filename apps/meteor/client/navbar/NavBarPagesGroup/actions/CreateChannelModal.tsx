import type { IRoom } from '@rocket.chat/core-typings';
import {
	Box,
	Modal,
	Button,
	Icon,
	Accordion,
	AccordionItem,
	Callout,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import { TextInput, Field, ToggleSwitch, FieldGroup, FieldLabel, FieldRow, FieldError, FieldHint } from '@rocket.chat/fuselage-forms';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import {
	useSetting,
	useTranslation,
	useEndpoint,
	useToastMessageDispatch,
	usePermissionWithScopedRoles,
	usePermission,
} from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useId, useEffect, useMemo, useState } from 'react';
import { useForm, Controller, FormProvider, useFieldArray } from 'react-hook-form';

import CreateChannelSecurityFields from './CreateChannelSecurityFields';
import { useEncryptedRoomDescription } from './useEncryptedRoomDescription';
import AbacMembershipPreview from '../../../components/ABAC/AbacMembershipPreview/AbacMembershipPreview';
import { useAbacMembershipPreview } from '../../../components/ABAC/AbacMembershipPreview/useAbacMembershipPreview';
import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';
import { useCreateChannelTypePermission } from '../../../hooks/useCreateChannelTypePermission';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { useIsFederationEnabled } from '../../../hooks/useIsFederationEnabled';
import { sdk } from '../../../lib/SDKClient';
import RoomFormAttributeFields from '../../../views/admin/ABAC/ABACRoomsTab/RoomFormAttributeFields';
import { useIsABACAvailable } from '../../../views/admin/ABAC/hooks/useIsABACAvailable';
import { useIsAbacEnforcementOn } from '../../../views/admin/ABAC/hooks/useIsAbacEnforcementOn';
import { useGoToRoom } from '../../../views/room/hooks/useGoToRoom';

export type CreateChannelModalProps = {
	teamId?: string;
	mainRoom?: IRoom;
	onClose: () => void;
	reload?: () => void;
	onSuccess?: (rid: string) => void | Promise<void>;
};

type CreateChannelModalPayload = {
	name: string;
	isPrivate: boolean;
	topic?: string;
	members: string[];
	readOnly: boolean;
	encrypted: boolean;
	broadcast: boolean;
	federated: boolean;
	isAbacManaged: boolean;
	attributes: { key: string; values: string[] }[];
};

const getFederationHintKey = (federationModule: boolean, featureToggle: boolean, federationAccessPermission: boolean): TranslationKey => {
	if (!federationModule) {
		return 'error-this-is-a-premium-feature';
	}

	if (!featureToggle) {
		return 'Federation_Matrix_Federated_Description_disabled';
	}

	if (!federationAccessPermission) {
		return 'error-not-authorized-federation';
	}

	return 'Federation_Matrix_Federated_Description';
};

const hasExternalMembers = (members: string[]): boolean => members.some((member) => member.startsWith('@'));

const MAX_ATTRIBUTE_ROWS = 10;
const TOTAL_ABAC_STEPS = 4;

const CreateChannelModal = ({ teamId = '', mainRoom, onClose, reload, onSuccess }: CreateChannelModalProps) => {
	const t = useTranslation();
	const canSetReadOnly = usePermissionWithScopedRoles('set-readonly', ['owner']);
	const e2eEnabled = useSetting('E2E_Enable');
	const namesValidation = useSetting('UTF8_Channel_Names_Validation');
	const allowSpecialNames = useSetting('UI_Allow_room_names_with_special_chars');
	const e2eEnabledForPrivateByDefault = useSetting('E2E_Enabled_Default_PrivateRooms') && e2eEnabled;
	const e2eEnforcedForPrivate = Boolean(useSetting('E2E_Force_Encryption_For_Private_Rooms')) && Boolean(e2eEnabled);

	const getEncryptedHint = useEncryptedRoomDescription('channel');

	const channelNameRegex = useMemo(() => new RegExp(`^${namesValidation}$`), [namesValidation]);

	const federationEnabled = useIsFederationEnabled();
	const { data: federationModule = false } = useHasLicenseModule('federation');
	const federationAccessPermission = usePermission('access-federation');
	const canUseFederation = federationModule && federationEnabled && federationAccessPermission;
	const federationFieldHint = getFederationHintKey(federationModule, federationEnabled, federationAccessPermission);

	// ABAC-P4 M2 — the stepped flow applies only when the room will be ABAC-managed.
	const isAbacAvailable = useIsABACAvailable();
	const abacEnforcementOn = useIsAbacEnforcementOn();
	const requiredAttributeKeys = useSetting<string[]>('ABAC_Required_Attributes', []) ?? [];

	const channelNameExists = useEndpoint('GET', '/v1/rooms.nameExists');
	const createChannel = useEndpoint('POST', '/v1/channels.create');
	const createPrivateChannel = useEndpoint('POST', '/v1/groups.create');
	const checkAssignability = useEndpoint('POST', '/v1/abac/attribute-assignability');

	const dispatchToastMessage = useToastMessageDispatch();

	const canOnlyCreateOneType = useCreateChannelTypePermission(mainRoom?._id);

	const methods = useForm<CreateChannelModalPayload>({
		defaultValues: {
			members: [],
			name: '',
			topic: '',
			isPrivate: canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : true,
			readOnly: false,
			encrypted: Boolean(e2eEnforcedForPrivate || e2eEnabledForPrivateByDefault),
			broadcast: false,
			federated: false,
			// Enforcement locks ABAC-managed on, so the flow starts there.
			isAbacManaged: isAbacAvailable && abacEnforcementOn,
			// Workspace-required attributes are pre-filled and cannot be removed.
			attributes: requiredAttributeKeys.map((key) => ({ key, values: [] })),
		},
	});

	const {
		formState: { errors },
		handleSubmit,
		control,
		setValue,
		watch,
		trigger,
	} = methods;

	const { fields, append, remove } = useFieldArray({ control, name: 'attributes' });

	const { isPrivate, broadcast, federated, encrypted, isAbacManaged, members, attributes } = watch();

	const isStepped = isAbacAvailable && isAbacManaged;
	const [step, setStep] = useState(1);
	const [pdpDenial, setPdpDenial] = useState<string | undefined>();

	useEffect(() => {
		if (federated) {
			// if room is federated, it cannot be encrypted or broadcast or readOnly
			setValue('encrypted', false);
			setValue('broadcast', false);
			setValue('readOnly', false);
		}
	}, [federated, setValue]);

	useEffect(() => {
		if (!isPrivate) {
			setValue('encrypted', false);
		}
	}, [isPrivate, setValue]);

	useEffect(() => {
		if (isPrivate && e2eEnforcedForPrivate && !federated) {
			setValue('encrypted', true);
		}
	}, [isPrivate, e2eEnforcedForPrivate, federated, setValue]);

	useEffect(() => {
		setValue('readOnly', broadcast);
	}, [broadcast, setValue]);

	// ABAC-P4 M2 switch interlocks (Figma 4838:45022). An ABAC-managed room is private by
	// definition, and ABAC is not applied to federated rooms (D8), so the two are exclusive.
	useEffect(() => {
		if (isAbacManaged) {
			setValue('isPrivate', true);
			setValue('federated', false);
		}
	}, [isAbacManaged, setValue]);

	// Turning ABAC-managed off collapses the flow, so the user must not be left on a step that no
	// longer exists.
	useEffect(() => {
		if (!isStepped) {
			setStep(1);
		}
	}, [isStepped]);

	const attributeMap = useMemo(
		() =>
			Object.fromEntries(attributes.filter(({ key, values }) => key && values.length).map(({ key, values }) => [key, values])) as Record<
				string,
				string[]
			>,
		[attributes],
	);

	const {
		data: compliance,
		isPending: isCompliancePending,
		error: complianceError,
	} = useAbacMembershipPreview({
		// The creator is a member of the room they create, so they are evaluated too.
		target: { memberUsernames: members },
		attributes: attributeMap,
		enabled: isStepped && step === TOTAL_ABAC_STEPS,
	});

	const noCompliantMembers = Boolean(compliance) && compliance?.counts.retaining === 0;

	const validateChannelName = async (name: string): Promise<string | undefined> => {
		if (!name) {
			return;
		}

		if (!allowSpecialNames && !channelNameRegex.test(name)) {
			return t('Name_cannot_have_special_characters');
		}

		const { exists } = await channelNameExists({ roomName: name });
		if (exists) {
			return t('Channel_already_exist', { channelName: name });
		}
	};

	const goToRoom = useGoToRoom();

	const handleCreateChannel = async ({
		name,
		members,
		readOnly,
		topic,
		broadcast,
		encrypted,
		federated,
		isAbacManaged,
	}: CreateChannelModalPayload) => {
		let roomData;
		const params = {
			name,
			members,
			readOnly,
			extraData: {
				topic,
				broadcast,
				encrypted,
				...(federated && { federated }),
				...(teamId && { teamId }),
			},
		};

		let rid: string;
		try {
			if (isPrivate) {
				roomData = await createPrivateChannel(params);
				rid = roomData.group._id;
			} else {
				roomData = await createChannel(params);
				rid = roomData.channel._id;
			}

			// Assigned after creation because the attribute write is what validates the actor's
			// authority and writes the audit entry. Authority was already checked when leaving
			// step 2, so a failure here is unexpected rather than routine — and the room is left
			// locked, which is the safe end state.
			if (isAbacManaged) {
				await sdk.rest.post(`/v1/abac/rooms/${rid}/attributes`, { attributes: attributeMap });
			}

			if (!teamId) {
				goToRoom(rid);
			}

			dispatchToastMessage({ type: 'success', message: t('Room_has_been_created') });
			void onSuccess?.(rid);
			reload?.();
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
			if (!(await trigger('attributes'))) {
				return;
			}

			// ABAC-P4 M2 — the PDP decides whether this actor may instantiate this combination, and
			// it is asked before anything is created so a denial does not leave a locked room behind.
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

	const e2eDisabled = useMemo<boolean>(
		() => !isPrivate || Boolean(!e2eEnabled) || federated || (e2eEnforcedForPrivate && isPrivate),
		[e2eEnabled, federated, isPrivate, e2eEnforcedForPrivate],
	);

	const createChannelFormId = useId();

	const showChannelFields = !isStepped || step === 1;
	const showAttributeFields = isStepped && step === 2;
	const showSecurityFields = !isStepped || step === 3;
	const showCompliance = isStepped && step === TOTAL_ABAC_STEPS;

	const abacManagedToggle = isAbacAvailable && (
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
	);

	return (
		<FormProvider {...methods}>
			<Modal
				aria-labelledby={`${createChannelFormId}-title`}
				wrapperFunction={(props: ComponentProps<typeof Box>) => (
					<Box is='form' id={createChannelFormId} onSubmit={handleSubmit(handleCreateChannel)} {...props} />
				)}
			>
				<ModalHeader>
					<ModalTitle id={`${createChannelFormId}-title`}>{t('Create_channel')}</ModalTitle>
					<ModalClose tabIndex={-1} title={t('Close')} onClick={onClose} />
				</ModalHeader>
				<ModalContent marginBlockEnd={2}>
					{showChannelFields && (
						<FieldGroup marginBlockEnd={24}>
							<Field>
								<FieldLabel required>{t('Name')}</FieldLabel>
								<FieldRow>
									<Controller
										control={control}
										name='name'
										rules={{
											required: t('Required_field', { field: t('Name') }),
											validate: (value) => validateChannelName(value),
										}}
										render={({ field }) => (
											<TextInput
												{...field}
												error={errors.name?.message}
												endAddon={<Icon name={isPrivate ? 'hashtag-lock' : 'hashtag'} size='x20' />}
												aria-required='true'
											/>
										)}
									/>
								</FieldRow>
								{errors.name && <FieldError>{errors.name.message}</FieldError>}
								{!allowSpecialNames && <FieldHint>{t('No_spaces_or_special_characters')}</FieldHint>}
							</Field>
							<Field>
								<FieldLabel>{t('Topic')}</FieldLabel>
								<FieldRow>
									<Controller control={control} name='topic' render={({ field }) => <TextInput {...field} />} />
								</FieldRow>
								<FieldHint>{t('Displayed_next_to_name')}</FieldHint>
							</Field>
							<Field>
								<FieldLabel>{t('Members')}</FieldLabel>
								<Controller
									control={control}
									name='members'
									rules={{
										validate: (members) =>
											!federated && hasExternalMembers(members) ? t('You_cannot_add_external_users_to_non_federated_room') : true,
									}}
									render={({ field }) => <UserAutoCompleteMultiple {...field} federated={federated} placeholder={t('Add_people')} />}
								/>
								{errors.members && <FieldError>{errors.members.message}</FieldError>}
							</Field>
							{abacManagedToggle}
							<Field>
								<FieldRow>
									<FieldLabel>{t('Private')}</FieldLabel>
									<Controller
										control={control}
										name='isPrivate'
										render={({ field: { value, ...field } }) => (
											<ToggleSwitch
												{...field}
												checked={canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : value}
												// An ABAC-managed room is private by definition.
												disabled={!!canOnlyCreateOneType || isAbacManaged}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint>{isPrivate ? t('People_can_only_join_by_being_invited') : t('Anyone_can_access')}</FieldHint>
							</Field>
						</FieldGroup>
					)}

					{showAttributeFields && (
						<FieldGroup marginBlockEnd={24}>
							<Box is='h5' fontScale='h5' color='titles-labels'>
								{t('ABAC_Room_attributes_section')}
							</Box>
							{pdpDenial && <Callout type='danger'>{pdpDenial}</Callout>}
							<RoomFormAttributeFields fields={fields} remove={remove} lockedLeadingCount={requiredAttributeKeys.length} />
							<Button
								width='full'
								disabled={fields.length >= MAX_ATTRIBUTE_ROWS}
								onClick={() => {
									append({ key: '', values: [] });
								}}
							>
								{t('ABAC_Add_Attribute')}
							</Button>
						</FieldGroup>
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

					{showSecurityFields &&
						(isStepped ? (
							<FieldGroup marginBlockEnd={24}>
								<Box is='h5' fontScale='h5' color='titles-labels'>
									{t('Security_and_permissions')}
								</Box>
								<CreateChannelSecurityFields
									canUseFederation={canUseFederation}
									federationFieldHint={federationFieldHint}
									canSetReadOnly={canSetReadOnly}
									e2eDisabled={e2eDisabled}
									encryptedHint={getEncryptedHint({ isPrivate, encrypted })}
								/>
							</FieldGroup>
						) : (
							<Accordion>
								<AccordionItem title={t('Advanced_settings')}>
									<FieldGroup>
										<Box is='h5' fontScale='h5' color='titles-labels'>
											{t('Security_and_permissions')}
										</Box>
										<CreateChannelSecurityFields
											canUseFederation={canUseFederation}
											federationFieldHint={federationFieldHint}
											canSetReadOnly={canSetReadOnly}
											e2eDisabled={e2eDisabled}
											encryptedHint={getEncryptedHint({ isPrivate, encrypted })}
										/>
									</FieldGroup>
								</AccordionItem>
							</Accordion>
						))}
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
							<Button primary onClick={handleNext}>
								{t('Next')}
							</Button>
						) : (
							<Button type='submit' primary disabled={showCompliance && (noCompliantMembers || isCompliancePending)}>
								{t('Create')}
							</Button>
						)}
					</ModalFooterControllers>
				</ModalFooter>
			</Modal>
		</FormProvider>
	);
};

export default CreateChannelModal;
