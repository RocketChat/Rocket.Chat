import {
	Box,
	Modal,
	ButtonGroup,
	Button,
	TextInput,
	Icon,
	Field,
	ToggleSwitch,
} from '@rocket.chat/fuselage';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useMemo, useState } from 'react';

import UserAutoCompleteMultiple from '../../components/UserAutoCompleteMultiple';
import { useMethod } from '../../contexts/ServerContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';

const CreateChannel = ({
	values,
	handlers,
	hasUnsavedChanges,
	onChangeUsers,
	onChangeType,
	onChangeBroadcast,
	canOnlyCreateOneType,
	e2eEnabledForPrivateByDefault,
	onCreate,
	onClose,
}) => {
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	const namesValidation = useSetting('UTF8_Names_Validation');
	const allowSpecialNames = useSetting('UI_Allow_room_names_with_special_chars');
	const channelNameExists = useMethod('roomNameExists');

	const channelNameRegex = useMemo(() => new RegExp(`^${namesValidation}$`), [namesValidation]);

	const [nameError, setNameError] = useState();

	const checkName = useDebouncedCallback(
		async (name) => {
			setNameError(false);
			if (hasUnsavedChanges) {
				return;
			}
			if (!name || name.length === 0) {
				return setNameError(t('Field_required'));
			}
			if (!allowSpecialNames && !channelNameRegex.test(name)) {
				return setNameError(t('error-invalid-name'));
			}
			const isNotAvailable = await channelNameExists(name);
			if (isNotAvailable) {
				return setNameError(t('Channel_already_exist', name));
			}
		},
		100,
		[channelNameRegex],
	);

	useEffect(() => {
		checkName(values.name);
	}, [checkName, values.name]);

	const e2edisabled = useMemo(
		() => !values.type || values.broadcast || !e2eEnabled || e2eEnabledForPrivateByDefault,
		[e2eEnabled, e2eEnabledForPrivateByDefault, values.broadcast, values.type],
	);

	const canSave = useMemo(() => hasUnsavedChanges && !nameError, [hasUnsavedChanges, nameError]);

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Create_channel')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Field mbe='x24'>
					<Field.Label>{t('Name')}</Field.Label>
					<Field.Row>
						<TextInput
							error={hasUnsavedChanges ? nameError : undefined}
							addon={<Icon name={values.type ? 'lock' : 'hash'} size='x20' />}
							placeholder={t('Channel_name')}
							onChange={handlers.handleName}
						/>
					</Field.Row>
					{hasUnsavedChanges && nameError && <Field.Error>{nameError}</Field.Error>}
				</Field>
				<Field mbe='x24'>
					<Field.Label>
						{t('Topic')}{' '}
						<Box is='span' color='neutral-600'>
							({t('optional')})
						</Box>
					</Field.Label>
					<Field.Row>
						<TextInput
							placeholder={t('Channel_what_is_this_channel_about')}
							onChange={handlers.handleDescription}
						/>
					</Field.Row>
				</Field>
				<Field mbe='x24'>
					<Box display='flex' justifyContent='space-between' alignItems='start'>
						<Box display='flex' flexDirection='column'>
							<Field.Label>{t('Private')}</Field.Label>
							<Field.Description>
								{values.type
									? t('Only_invited_users_can_acess_this_channel')
									: t('Everyone_can_access_this_channel')}
							</Field.Description>
						</Box>
						<ToggleSwitch
							checked={values.type}
							disabled={!!canOnlyCreateOneType}
							onChange={onChangeType}
						/>
					</Box>
				</Field>
				<Field mbe='x24'>
					<Box display='flex' justifyContent='space-between' alignItems='start'>
						<Box display='flex' flexDirection='column'>
							<Field.Label>{t('Read_only')}</Field.Label>
							<Field.Description>
								{t('All_users_in_the_channel_can_write_new_messages')}
							</Field.Description>
						</Box>
						<ToggleSwitch
							checked={values.readOnly}
							disabled={values.broadcast}
							onChange={handlers.handleReadOnly}
						/>
					</Box>
				</Field>
				<Field mbe='x24'>
					<Box display='flex' justifyContent='space-between' alignItems='start'>
						<Box display='flex' flexDirection='column'>
							<Field.Label>{t('Encrypted')}</Field.Label>
							<Field.Description>
								{values.type ? t('Encrypted_channel_Description') : t('Encrypted_not_available')}
							</Field.Description>
						</Box>
						<ToggleSwitch
							checked={values.encrypted}
							disabled={e2edisabled}
							onChange={handlers.handleEncrypted}
						/>
					</Box>
				</Field>
				<Field mbe='x24'>
					<Box display='flex' justifyContent='space-between' alignItems='start'>
						<Box display='flex' flexDirection='column'>
							<Field.Label>{t('Broadcast')}</Field.Label>
							<Field.Description>{t('Broadcast_channel_Description')}</Field.Description>
						</Box>
						<ToggleSwitch checked={values.broadcast} onChange={onChangeBroadcast} />
					</Box>
				</Field>
				<Field mbe='x24'>
					<Field.Label>{`${t('Add_members')} (${t('optional')})`}</Field.Label>
					<UserAutoCompleteMultiple value={values.users} onChange={onChangeUsers} />
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!canSave} onClick={onCreate} primary>
						{t('Create')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateChannel;
