import type { IRoom } from '@rocket.chat/core-typings';
import {
	Box,
	Modal,
	Button,
	TextInput,
	Icon,
	Field,
	ToggleSwitch,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldError,
	FieldHint,
	FieldDescription,
	Accordion,
	AccordionItem,
} from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import {
	useSetting,
	useTranslation,
	useEndpoint,
	usePermission,
	useToastMessageDispatch,
	usePermissionWithScopedRoles,
} from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { useId, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import UserAutoCompleteMultipleFederated from '../../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { goToRoomById } from '../../../lib/utils/goToRoomById';
import { useEncryptedRoomDescription } from '../hooks/useEncryptedRoomDescription';

type CreateChannelModalProps = {
	teamId?: string;
	mainRoom?: IRoom;
	onClose: () => void;
	reload?: () => void;
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
};

const getFederationHintKey = (licenseModule: ReturnType<typeof useHasLicenseModule>, featureToggle: boolean): TranslationKey => {
	if (licenseModule === 'loading' || !licenseModule) {
		return 'error-this-is-a-premium-feature';
	}
	if (!featureToggle) {
		return 'Federation_Matrix_Federated_Description_disabled';
	}
	return 'Federation_Matrix_Federated_Description';
};

const CreateChannelModal = ({ teamId = '', mainRoom, onClose, reload }: CreateChannelModalProps): ReactElement => {
	const t = useTranslation();
	const canSetReadOnly = usePermissionWithScopedRoles('set-readonly', ['owner']);
	const e2eEnabled = useSetting('E2E_Enable');
	const namesValidation = useSetting('UTF8_Channel_Names_Validation');
	const allowSpecialNames = useSetting('UI_Allow_room_names_with_special_chars');
	const federationEnabled = useSetting('Federation_Matrix_enabled', false);
	const e2eEnabledForPrivateByDefault = useSetting('E2E_Enabled_Default_PrivateRooms') && e2eEnabled;

	const canCreateChannel = usePermission('create-c');
	const canCreateGroup = usePermission('create-p');
	const getEncryptedHint = useEncryptedRoomDescription('channel');

	const channelNameRegex = useMemo(() => new RegExp(`^${namesValidation}$`), [namesValidation]);
	const federatedModule = useHasLicenseModule('federation');
	const canUseFederation = federatedModule !== 'loading' && federatedModule && federationEnabled;

	const channelNameExists = useEndpoint('GET', '/v1/rooms.nameExists');
	const createChannel = useEndpoint('POST', '/v1/channels.create');
	const createPrivateChannel = useEndpoint('POST', '/v1/groups.create');

	const canCreateTeamChannel = usePermission('create-team-channel', mainRoom?._id);
	const canCreateTeamGroup = usePermission('create-team-group', mainRoom?._id);

	const dispatchToastMessage = useToastMessageDispatch();

	const canOnlyCreateOneType = useMemo(() => {
		if ((!teamId && !canCreateChannel && canCreateGroup) || (teamId && !canCreateTeamChannel && canCreateTeamGroup)) {
			return 'p';
		}
		if ((!teamId && canCreateChannel && !canCreateGroup) || (teamId && canCreateTeamChannel && !canCreateTeamGroup)) {
			return 'c';
		}
		return false;
	}, [canCreateChannel, canCreateGroup, canCreateTeamChannel, canCreateTeamGroup, teamId]);

	const {
		register,
		formState: { errors },
		handleSubmit,
		control,
		setValue,
		watch,
	} = useForm({
		mode: 'onBlur',
		defaultValues: {
			members: [],
			name: '',
			topic: '',
			isPrivate: canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : true,
			readOnly: false,
			encrypted: (e2eEnabledForPrivateByDefault as boolean) ?? false,
			broadcast: false,
			federated: false,
		},
	});

	const { isPrivate, broadcast, readOnly, federated, encrypted } = watch();

	useEffect(() => {
		if (!isPrivate) {
			setValue('encrypted', false);
		}

		if (broadcast) {
			setValue('encrypted', false);
		}

		if (federated) {
			// if room is federated, it cannot be encrypted or broadcast or readOnly
			setValue('encrypted', false);
			setValue('broadcast', false);
			setValue('readOnly', false);
		}

		setValue('readOnly', broadcast);
	}, [federated, setValue, broadcast, isPrivate]);

	const validateChannelName = async (name: string): Promise<string | undefined> => {
		if (!name) {
			return;
		}

		if (!allowSpecialNames && !channelNameRegex.test(name)) {
			return t('Name_cannot_have_special_characters');
		}

		const { exists } = await channelNameExists({ roomName: name });
		if (exists) {
			return t('Channel_already_exist', name);
		}
	};

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

		try {
			if (isPrivate) {
				roomData = await createPrivateChannel(params);
				!teamId && goToRoomById(roomData.group._id);
			} else {
				roomData = await createChannel(params);
				!teamId && goToRoomById(roomData.channel._id);
			}

			dispatchToastMessage({ type: 'success', message: t('Room_has_been_created') });
			reload?.();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onClose();
		}
	};

	const e2eDisabled = useMemo<boolean>(
		() => !isPrivate || broadcast || Boolean(!e2eEnabled) || Boolean(e2eEnabledForPrivateByDefault),
		[e2eEnabled, e2eEnabledForPrivateByDefault, broadcast, isPrivate],
	);

	const createChannelFormId = useId();
	const nameId = useId();
	const topicId = useId();
	const privateId = useId();
	const federatedId = useId();
	const readOnlyId = useId();
	const encryptedId = useId();
	const broadcastId = useId();
	const addMembersId = useId();

	return (
		<Modal
			data-qa='create-channel-modal'
			aria-labelledby={`${createChannelFormId}-title`}
			wrapperFunction={(props: ComponentProps<typeof Box>) => (
				<Box is='form' id={createChannelFormId} onSubmit={handleSubmit(handleCreateChannel)} {...props} />
			)}
		>
			<Modal.Header>
				<Modal.Title id={`${createChannelFormId}-title`}>{t('Create_channel')}</Modal.Title>
				<Modal.Close tabIndex={-1} title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content mbe={2}>
				<FieldGroup mbe={24}>
					<Field>
						<FieldLabel required htmlFor={nameId}>
							{t('Name')}
						</FieldLabel>
						<FieldRow>
							<TextInput
								id={nameId}
								data-qa-type='channel-name-input'
								{...register('name', {
									required: t('Required_field', { field: t('Name') }),
									validate: (value) => validateChannelName(value),
								})}
								error={errors.name?.message}
								addon={<Icon name={isPrivate ? 'hashtag-lock' : 'hashtag'} size='x20' />}
								aria-invalid={errors.name ? 'true' : 'false'}
								aria-describedby={`${nameId}-error ${nameId}-hint`}
								aria-required='true'
							/>
						</FieldRow>
						{errors.name && (
							<FieldError aria-live='assertive' id={`${nameId}-error`}>
								{errors.name.message}
							</FieldError>
						)}
						{!allowSpecialNames && <FieldHint id={`${nameId}-hint`}>{t('No_spaces')}</FieldHint>}
					</Field>
					<Field>
						<FieldLabel htmlFor={topicId}>{t('Topic')}</FieldLabel>
						<FieldRow>
							<TextInput id={topicId} aria-describedby={`${topicId}-hint`} {...register('topic')} data-qa-type='channel-topic-input' />
						</FieldRow>
						<FieldHint id={`${topicId}-hint`}>{t('Displayed_next_to_name')}</FieldHint>
					</Field>
					<Field>
						<FieldLabel htmlFor={addMembersId}>{t('Members')}</FieldLabel>
						<Controller
							control={control}
							name='members'
							render={({ field: { onChange, value } }): ReactElement => (
								<UserAutoCompleteMultipleFederated id={addMembersId} value={value} onChange={onChange} placeholder={t('Add_people')} />
							)}
						/>
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={privateId}>{t('Private')}</FieldLabel>
							<Controller
								control={control}
								name='isPrivate'
								render={({ field: { onChange, value, ref } }): ReactElement => (
									<ToggleSwitch
										id={privateId}
										aria-describedby={`${privateId}-hint`}
										ref={ref}
										checked={canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : value}
										disabled={!!canOnlyCreateOneType}
										onChange={onChange}
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
									<FieldLabel htmlFor={federatedId}>{t('Federation_Matrix_Federated')}</FieldLabel>
									<Controller
										control={control}
										name='federated'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch
												aria-describedby={`${federatedId}-hint`}
												id={federatedId}
												ref={ref}
												checked={value}
												disabled={!canUseFederation}
												onChange={onChange}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint id={`${federatedId}-hint`}>{t(getFederationHintKey(federatedModule, federationEnabled))}</FieldHint>
							</Field>
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={encryptedId}>{t('Encrypted')}</FieldLabel>
									<Controller
										control={control}
										name='encrypted'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch
												id={encryptedId}
												ref={ref}
												checked={value}
												disabled={e2eDisabled || federated}
												onChange={onChange}
												aria-describedby={`${encryptedId}-hint`}
												aria-labelledby='Encrypted_channel_Label'
											/>
										)}
									/>
								</FieldRow>
								<FieldDescription id={`${encryptedId}-hint`}>{getEncryptedHint({ isPrivate, broadcast, encrypted })}</FieldDescription>
							</Field>
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={readOnlyId}>{t('Read_only')}</FieldLabel>
									<Controller
										control={control}
										name='readOnly'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch
												id={readOnlyId}
												aria-describedby={`${readOnlyId}-hint`}
												ref={ref}
												checked={value}
												disabled={!canSetReadOnly || broadcast || federated}
												onChange={onChange}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint id={`${readOnlyId}-hint`}>
									{readOnly ? t('Read_only_field_hint_enabled', { roomType: 'channel' }) : t('Anyone_can_send_new_messages')}
								</FieldHint>
							</Field>
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={broadcastId}>{t('Broadcast')}</FieldLabel>
									<Controller
										control={control}
										name='broadcast'
										render={({ field: { onChange, value, ref } }): ReactElement => (
											<ToggleSwitch
												aria-describedby={`${broadcastId}-hint`}
												id={broadcastId}
												ref={ref}
												checked={value}
												disabled={!!federated}
												onChange={onChange}
											/>
										)}
									/>
								</FieldRow>
								{broadcast && <FieldHint id={`${broadcastId}-hint`}>{t('Broadcast_hint_enabled', { roomType: 'channel' })}</FieldHint>}
							</Field>
						</FieldGroup>
					</AccordionItem>
				</Accordion>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button type='submit' primary data-qa-type='create-channel-confirm-button'>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateChannelModal;
