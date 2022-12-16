import { Box, Modal, Button, TextInput, Icon, Field, ToggleSwitch, FieldGroup } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetting, useTranslation, useEndpoint, usePermission, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import UserAutoCompleteMultipleFederated from '../../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import { goToRoomById } from '../../../lib/utils/goToRoomById';

type CreateChannelModalProps = {
	teamId?: string;
	onClose: () => void;
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
		return 'error-this-is-an-ee-feature';
	}
	if (!featureToggle) {
		return 'Federation_Matrix_Federated_Description_disabled';
	}
	return 'Federation_Matrix_Federated_Description';
};

const CreateChannelModal = ({ teamId = '', onClose }: CreateChannelModalProps): ReactElement => {
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	const canSetReadOnly = usePermission('set-readonly');
	const namesValidation = useSetting('UTF8_Channel_Names_Validation');
	const allowSpecialNames = useSetting('UI_Allow_room_names_with_special_chars');
	const federationEnabled = useSetting('Federation_Matrix_enabled');
	const channelNameExists = useEndpoint('GET', '/v1/rooms.nameExists');

	const channelNameRegex = useMemo(() => new RegExp(`^${namesValidation}$`), [namesValidation]);
	const federatedModule = useHasLicenseModule('federation');
	const canUseFederation = federatedModule !== 'loading' && federatedModule && federationEnabled;

	const createChannel = useEndpoint('POST', '/v1/channels.create');
	const createPrivateChannel = useEndpoint('POST', '/v1/groups.create');
	const canCreateChannel = usePermission('create-c');
	const canCreatePrivateChannel = usePermission('create-p');
	const e2eEnabledForPrivateByDefault = useSetting('E2E_Enabled_Default_PrivateRooms');
	const dispatchToastMessage = useToastMessageDispatch();

	const canOnlyCreateOneType = useMemo(() => {
		if (!canCreateChannel && canCreatePrivateChannel) {
			return 'p';
		}
		if (canCreateChannel && !canCreatePrivateChannel) {
			return 'c';
		}
		return false;
	}, [canCreateChannel, canCreatePrivateChannel]);

	const {
		register,
		formState: { isDirty, errors },
		handleSubmit,
		control,
		setValue,
		watch,
	} = useForm({
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

	const { isPrivate, broadcast, readOnly, federated } = watch();

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
			return t('error-invalid-name');
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
				federated,
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

	return (
		<Modal data-qa='create-channel-modal'>
			<Modal.Header>
				<Modal.Title>{t('Create_channel')}</Modal.Title>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Name')}</Field.Label>
						<Field.Row>
							<TextInput
								autoFocus
								data-qa-type='channel-name-input'
								{...register('name', {
									required: t('error-the-field-is-required', { field: t('Name') }),
									validate: (value) => validateChannelName(value),
								})}
								error={errors.name?.message}
								addon={<Icon name={isPrivate ? 'hashtag-lock' : 'hashtag'} size='x20' />}
								placeholder={t('Channel_name')}
							/>
						</Field.Row>
						{errors.name && <Field.Error>{errors.name.message}</Field.Error>}
					</Field>
					<Field>
						<Field.Label>
							{t('Topic')}{' '}
							<Box is='span' color='annotation'>
								({t('optional')})
							</Box>
						</Field.Label>
						<Field.Row>
							<TextInput {...register('topic')} placeholder={t('Channel_what_is_this_channel_about')} data-qa-type='channel-topic-input' />
						</Field.Row>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Private')}</Field.Label>
								<Field.Description>
									{isPrivate ? t('Only_invited_users_can_acess_this_channel') : t('Everyone_can_access_this_channel')}
								</Field.Description>
							</Box>
							<Controller
								control={control}
								name='isPrivate'
								render={({ field: { onChange, value, ref } }): ReactElement => (
									<ToggleSwitch
										ref={ref}
										checked={value}
										disabled={!!canOnlyCreateOneType}
										onChange={onChange}
										data-qa-type='channel-private-toggle'
									/>
								)}
							/>
						</Box>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Federation_Matrix_Federated')}</Field.Label>
								<Field.Description>{t(getFederationHintKey(federatedModule, Boolean(federationEnabled)))}</Field.Description>
							</Box>
							<Controller
								control={control}
								name='federated'
								render={({ field: { onChange, value, ref } }): ReactElement => (
									<ToggleSwitch ref={ref} checked={value} disabled={!canUseFederation} onChange={onChange} />
								)}
							/>
						</Box>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Read_only')}</Field.Label>
								<Field.Description>
									{readOnly ? t('Only_authorized_users_can_write_new_messages') : t('All_users_in_the_channel_can_write_new_messages')}
								</Field.Description>
							</Box>
							<Controller
								control={control}
								name='readOnly'
								render={({ field: { onChange, value, ref } }): ReactElement => (
									<ToggleSwitch ref={ref} checked={value} disabled={!canSetReadOnly || broadcast || federated} onChange={onChange} />
								)}
							/>
						</Box>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Encrypted')}</Field.Label>
								<Field.Description>{isPrivate ? t('Encrypted_channel_Description') : t('Encrypted_not_available')}</Field.Description>
							</Box>
							<Controller
								control={control}
								name='encrypted'
								render={({ field: { onChange, value, ref } }): ReactElement => (
									<ToggleSwitch ref={ref} checked={value} disabled={e2eDisabled || federated} onChange={onChange} />
								)}
							/>
						</Box>
					</Field>
					<Field>
						<Box display='flex' justifyContent='space-between' alignItems='start'>
							<Box display='flex' flexDirection='column' width='full'>
								<Field.Label>{t('Broadcast')}</Field.Label>
								<Field.Description>{t('Broadcast_channel_Description')}</Field.Description>
							</Box>
							<Controller
								control={control}
								name='broadcast'
								render={({ field: { onChange, value, ref } }): ReactElement => (
									<ToggleSwitch ref={ref} checked={value} disabled={!!federated} onChange={onChange} />
								)}
							/>
						</Box>
					</Field>
					<Field>
						<Field.Label>
							{t('Add_members')}{' '}
							<Box is='span' color='annotation'>
								({t('optional')})
							</Box>
						</Field.Label>
						<Controller
							control={control}
							name='members'
							render={({ field: { onChange, value } }): ReactElement => (
								<UserAutoCompleteMultipleFederated value={value} onChange={onChange} />
							)}
						/>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!isDirty} onClick={handleSubmit(handleCreateChannel)} primary data-qa-type='create-channel-confirm-button'>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateChannelModal;
