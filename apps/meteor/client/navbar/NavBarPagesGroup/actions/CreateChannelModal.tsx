import type { IAbacAttributeDefinition, IRoom } from '@rocket.chat/core-typings';
import {
	Box,
	Modal,
	Icon,
	Accordion,
	AccordionItem,
	Callout,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
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
import { useId, useEffect, useMemo } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';

import { useEncryptedRoomDescription } from './useEncryptedRoomDescription';
import AbacMembershipPreview from '../../../components/ABAC/AbacMembershipPreview/AbacMembershipPreview';
import type { AbacRoomCreation } from '../../../components/ABAC/AbacRoomCreation';
import {
	AbacAttributesStep,
	AbacManagedField,
	CreateRoomStepsFooter,
	isAbacCreationBlocked,
	useAbacCreationFlow,
	useCreateRoomSteps,
} from '../../../components/ABAC/AbacRoomCreation';
import UserAutoCompleteMultiple from '../../../components/UserAutoCompleteMultiple';
import { useCreateChannelTypePermission } from '../../../hooks/useCreateChannelTypePermission';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { useIsFederationEnabled } from '../../../hooks/useIsFederationEnabled';
import { useGoToRoom } from '../../../views/room/hooks/useGoToRoom';

export type CreateChannelModalProps = {
	teamId?: string;
	mainRoom?: IRoom;
	onClose: () => void;
	reload?: () => void;
	onSuccess?: (rid: string) => void | Promise<void>;
	abac?: AbacRoomCreation;
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
	attributes: IAbacAttributeDefinition[];
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

const getNameIcon = (isAbacManaged: boolean, isPrivate: boolean): ComponentProps<typeof Icon>['name'] => {
	if (isAbacManaged) {
		return 'hash-shield';
	}

	return isPrivate ? 'hashtag-lock' : 'hashtag';
};

const hasExternalMembers = (members: string[]): boolean => members.some((member) => member.startsWith('@'));

const initialAttributes = (abac?: AbacRoomCreation): IAbacAttributeDefinition[] =>
	abac?.requiredAttributes.length ? abac.requiredAttributes.map((key) => ({ key, values: [] })) : [{ key: '', values: [] }];

const CreateChannelModal = ({ teamId = '', mainRoom, onClose, reload, onSuccess, abac }: CreateChannelModalProps) => {
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

	const channelNameExists = useEndpoint('GET', '/v1/rooms.nameExists');
	const createChannel = useEndpoint('POST', '/v1/channels.create');
	const createPrivateChannel = useEndpoint('POST', '/v1/groups.create');

	const dispatchToastMessage = useToastMessageDispatch();

	const canOnlyCreateOneType = useCreateChannelTypePermission(mainRoom?._id);
	const canCreatePrivate = canOnlyCreateOneType !== 'c';
	const creationBlocked = isAbacCreationBlocked(abac, canCreatePrivate);

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
			isAbacManaged: Boolean(abac?.enforced),
			attributes: initialAttributes(abac),
		},
	});

	const {
		formState: { errors, isSubmitting },
		handleSubmit,
		control,
		setValue,
		watch,
	} = methods;

	const { isPrivate, broadcast, readOnly, federated, encrypted, isAbacManaged, members, attributes } = watch();

	const { step, index, total, isLast, next, back } = useCreateRoomSteps(Boolean(abac), isAbacManaged);
	const abacFlow = useAbacCreationFlow({ abac, isAbacManaged, step, members, attributes });

	useEffect(() => {
		if (isAbacManaged) {
			setValue('isPrivate', true);
			setValue('federated', false);
		}
	}, [isAbacManaged, setValue]);

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

	const handleCreateChannel = async ({ name, members, readOnly, topic, broadcast, encrypted, federated }: CreateChannelModalPayload) => {
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
				roomData = await createPrivateChannel({ ...params, ...(abacFlow.isManaged && { abacAttributes: abacFlow.attributeMap }) });
				rid = roomData.group._id;
				if (!teamId) goToRoom(roomData.group._id);
			} else {
				roomData = await createChannel(params);
				rid = roomData.channel._id;
				if (!teamId) goToRoom(roomData.channel._id);
			}

			dispatchToastMessage({ type: 'success', message: t('Room_has_been_created') });
			if ('skippedMembers' in roomData && roomData.skippedMembers?.length) {
				dispatchToastMessage({ type: 'info', message: t('ABAC_Members_Not_Added', { count: roomData.skippedMembers.length }) });
			}
			void onSuccess?.(rid);
			reload?.();
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleStepSubmit = handleSubmit(async (data) => {
		if (isLast) {
			return handleCreateChannel(data);
		}

		if (step === 'attributes' && !(await abacFlow.confirmAttributes())) {
			return;
		}

		next();
	});

	const e2eDisabled = useMemo<boolean>(
		() => !isPrivate || Boolean(!e2eEnabled) || federated || (e2eEnforcedForPrivate && isPrivate),
		[e2eEnabled, federated, isPrivate, e2eEnforcedForPrivate],
	);

	const createChannelFormId = useId();

	const securityFields = (
		<FieldGroup>
			<Box is='h5' fontScale='h5' color='titles-labels'>
				{t('Security_and_permissions')}
			</Box>
			{!isAbacManaged && (
				<Field>
					<FieldRow>
						<FieldLabel>{t('Federation_Matrix_Federated')}</FieldLabel>
						<Controller
							control={control}
							name='federated'
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} disabled={!canUseFederation} />}
						/>
					</FieldRow>
					<FieldHint>{t(federationFieldHint)}</FieldHint>
				</Field>
			)}
			<Field>
				<FieldRow>
					<FieldLabel>{t('Encrypted')}</FieldLabel>
					<Controller
						control={control}
						name='encrypted'
						render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} disabled={e2eDisabled} />}
					/>
				</FieldRow>
				<FieldHint>{getEncryptedHint({ isPrivate, encrypted })}</FieldHint>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel>{t('Read_only')}</FieldLabel>
					<Controller
						control={control}
						name='readOnly'
						render={({ field: { value, ...field } }) => (
							<ToggleSwitch {...field} checked={value} disabled={!canSetReadOnly || broadcast || federated} />
						)}
					/>
				</FieldRow>
				<FieldHint>{readOnly ? t('Read_only_field_hint_enabled', { roomType: 'channel' }) : t('Anyone_can_send_new_messages')}</FieldHint>
			</Field>
			<Field>
				<FieldRow>
					<FieldLabel>{t('Broadcast')}</FieldLabel>
					<Controller
						control={control}
						name='broadcast'
						render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} disabled={!!federated} />}
					/>
				</FieldRow>
				{broadcast && <FieldHint>{t('Broadcast_hint_enabled', { roomType: 'channel' })}</FieldHint>}
			</Field>
		</FieldGroup>
	);

	return (
		<FormProvider {...methods}>
			<Modal
				aria-labelledby={`${createChannelFormId}-title`}
				wrapperFunction={(props: ComponentProps<typeof Box>) => (
					<Box is='form' id={createChannelFormId} onSubmit={handleStepSubmit} {...props} />
				)}
			>
				<ModalHeader>
					<ModalTitle id={`${createChannelFormId}-title`}>{t('Create_channel')}</ModalTitle>
					<ModalClose tabIndex={-1} title={t('Close')} onClick={onClose} />
				</ModalHeader>
				<ModalContent marginBlockEnd={2}>
					{step === 'details' && (
						<>
							{creationBlocked && (
								<Callout type='danger' marginBlockEnd={16}>
									{t('ABAC_Room_Creation_Not_Allowed')}
								</Callout>
							)}
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
													endAddon={<Icon name={getNameIcon(abacFlow.isManaged, isPrivate)} size='x20' />}
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
								{abac && <AbacManagedField abac={abac} canCreatePrivate={canCreatePrivate} />}
								<Field>
									<FieldRow>
										<FieldLabel>{t('Private')}</FieldLabel>
										<Controller
											control={control}
											name='isPrivate'
											render={({ field: { value, ...field } }) => (
												<ToggleSwitch
													{...field}
													checked={isAbacManaged || (canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : value)}
													disabled={isAbacManaged || !!canOnlyCreateOneType}
												/>
											)}
										/>
									</FieldRow>
									<FieldHint>{isPrivate ? t('People_can_only_join_by_being_invited') : t('Anyone_can_access')}</FieldHint>
								</Field>
							</FieldGroup>
							{total === 1 && (
								<Accordion>
									<AccordionItem title={t('Advanced_settings')}>{securityFields}</AccordionItem>
								</Accordion>
							)}
						</>
					)}
					{step === 'attributes' && (
						<AbacAttributesStep
							requiredKeys={abac?.requiredAttributes ?? []}
							assignable={abacFlow.assignable.data}
							isPending={abacFlow.assignable.isPending}
							error={abacFlow.assignable.error}
							assignabilityError={abacFlow.assignabilityError}
						/>
					)}
					{step === 'security' && securityFields}
					{step === 'preview' && (
						<AbacMembershipPreview
							data={abacFlow.preview.data}
							isPending={abacFlow.preview.isPending}
							isError={abacFlow.preview.isError}
							error={abacFlow.preview.error}
						/>
					)}
				</ModalContent>
				<CreateRoomStepsFooter
					index={index}
					total={total}
					onCancel={onClose}
					onBack={back}
					submitDisabled={creationBlocked || abacFlow.isStepBlocked}
					isSubmitting={total > 1 && isSubmitting}
				/>
			</Modal>
		</FormProvider>
	);
};

export default CreateChannelModal;
