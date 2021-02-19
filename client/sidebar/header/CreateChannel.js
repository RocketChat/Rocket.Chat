import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useMutableCallback, useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { Box, Modal, ButtonGroup, Button, TextInput, Icon, Field, ToggleSwitch } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useForm } from '../../hooks/useForm';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';
import UserAutoCompleteMultiple from '../../../ee/client/audit/UserAutoCompleteMultiple';
import { useSetting } from '../../contexts/SettingsContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useMethod } from '../../contexts/ServerContext';

export const CreateChannel = ({
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
	const channelNameRegex = useMemo(() => {
		if (allowSpecialNames) {
			return '';
		}
		const regex = new RegExp(`^${ namesValidation }$`);

		return regex;
	}, [allowSpecialNames, namesValidation]);

	const [nameError, setNameError] = useState();

	const checkName = useDebouncedCallback(async (name) => {
		setNameError(false);
		if (hasUnsavedChanges) { return; }
		if (!name || name.length === 0) { return setNameError(t('Field_required')); }
		if (!channelNameRegex.test(name)) { return setNameError(t('error-invalid-name')); }
		const isNotAvailable = await channelNameExists(name);
		if (isNotAvailable) { return setNameError(t('Channel_already_exist', name)); }
	}, 100, [name]);

	useEffect(() => {
		checkName(values.name);
	}, [checkName, values.name]);

	const e2edisabled = useMemo(() => !values.type || values.broadcast || !e2eEnabled || e2eEnabledForPrivateByDefault, [e2eEnabled, e2eEnabledForPrivateByDefault, values.broadcast, values.type]);

	const canSave = useMemo(() => hasUnsavedChanges && !nameError, [hasUnsavedChanges, nameError]);

	return <Modal>
		<Modal.Header>
			<Modal.Title>{t('Create_channel')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content>
			<Field mbe='x24'>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput error={hasUnsavedChanges ? nameError : undefined} addon={<Icon name={values.type ? 'lock' : 'hash'} size='x20' />} placeholder={t('Channel_name')} onChange={handlers.handleName}/>
				</Field.Row>
				{hasUnsavedChanges && nameError && <Field.Error>
					{nameError}
				</Field.Error>}
			</Field>
			<Field mbe='x24'>
				<Field.Label>{t('Topic')} <Box is='span' color='neutral-600'>({t('optional')})</Box></Field.Label>
				<Field.Row>
					<TextInput placeholder={t('Channel_what_is_this_channel_about')} onChange={handlers.handleDescription}/>
				</Field.Row>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Private')}</Field.Label>
						<Field.Description>{values.type ? t('Only_invited_users_can_acess_this_channel') : t('Everyone_can_access_this_channel')}</Field.Description>
					</Box>
					<ToggleSwitch checked={values.type} disabled={!!canOnlyCreateOneType} onChange={onChangeType}/>
				</Box>
			</Field>
			<Field mbe='x24' disabled={values.broadcast}>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Read_only')}</Field.Label>
						<Field.Description>{t('All_users_in_the_channel_can_write_new_messages')}</Field.Description>
					</Box>
					<ToggleSwitch checked={values.readOnly} disabled={values.broadcast} onChange={handlers.handleReadOnly}/>
				</Box>
			</Field>
			<Field disabled={e2edisabled} mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Encrypted')}</Field.Label>
						<Field.Description>{values.type ? t('Encrypted_channel_Description') : t('Encrypted_not_available')}</Field.Description>
					</Box>
					<ToggleSwitch checked={values.encrypted} disabled={e2edisabled} onChange={handlers.handleEncrypted} />
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
				<Field.Label>{`${ t('Add_members') } (${ t('optional') })`}</Field.Label>
				<UserAutoCompleteMultiple value={values.users} onChange={onChangeUsers}/>
			</Field>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onClose}>{t('Cancel')}</Button>
				<Button disabled={!canSave} onClick={onCreate} primary>{t('Create')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default memo(({
	onClose,
}) => {
	const createChannel = useEndpointActionExperimental('POST', 'channels.create');
	const createPrivateChannel = useEndpointActionExperimental('POST', 'groups.create');
	const setChannelDescription = useEndpointActionExperimental('POST', 'channels.setDescription');
	const setPrivateChannelDescription = useEndpointActionExperimental('POST', 'groups.setDescription');
	const canCreateChannel = usePermission('create-c');
	const canCreatePrivateChannel = usePermission('create-p');
	const e2eEnabledForPrivateByDefault = useSetting('E2E_Enabled_Default_PrivateRooms');
	const canOnlyCreateOneType = useMemo(() => {
		if (!canCreateChannel && canCreatePrivateChannel) {
			return 'p';
		}
		if (canCreateChannel && !canCreatePrivateChannel) {
			return 'c';
		}
		return false;
	}, [canCreateChannel, canCreatePrivateChannel]);


	const initialValues = {
		users: [],
		name: '',
		description: '',
		type: canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : true,
		readOnly: false,
		encrypted: e2eEnabledForPrivateByDefault ?? false,
		broadcast: false,
	};
	const { values, handlers, hasUnsavedChanges } = useForm(initialValues);

	const {
		users,
		name,
		description,
		type,
		readOnly,
		broadcast,
		encrypted,
	} = values;
	const {
		handleUsers,
		handleEncrypted,
		handleType,
		handleBroadcast,
		handleReadOnly,
	} = handlers;

	const onChangeUsers = useMutableCallback((value, action) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return handleUsers([...users, value]);
		}
		handleUsers(users.filter((current) => current !== value));
	});

	const onChangeType = useMutableCallback((value) => {
		handleEncrypted(!value);
		return handleType(value);
	});

	const onChangeBroadcast = useMutableCallback((value) => {
		handleEncrypted(!value);
		handleReadOnly(value);
		return handleBroadcast(value);
	});

	const onCreate = useCallback(async () => {
		const goToRoom = (rid) => {
			FlowRouter.goToRoomById(rid);
		};

		const params = {
			name,
			members: users,
			readOnly,
			extraData: {
				broadcast,
				encrypted,
			},
		};
		let roomData;

		if (type) {
			roomData = await createPrivateChannel(params);
			goToRoom(roomData.group._id);
		} else {
			roomData = await createChannel(params);
			goToRoom(roomData.channel._id);
		}

		if (roomData.success && roomData.group && description) {
			setPrivateChannelDescription({ description, roomName: roomData.group.name });
		} else if (roomData.success && roomData.channel && description) {
			setChannelDescription({ description, roomName: roomData.channel.name });
		}

		onClose();
	}, [broadcast,
		createChannel,
		createPrivateChannel,
		description,
		encrypted,
		name,
		onClose,
		readOnly,
		setChannelDescription,
		setPrivateChannelDescription,
		type,
		users,
	]);

	return <CreateChannel
		values={values}
		handlers={handlers}
		hasUnsavedChanges={hasUnsavedChanges}
		onChangeUsers={onChangeUsers}
		onChangeType={onChangeType}
		onChangeBroadcast={onChangeBroadcast}
		canOnlyCreateOneType={canOnlyCreateOneType}
		e2eEnabledForPrivateByDefault={e2eEnabledForPrivateByDefault}
		onClose={onClose}
		onCreate={onCreate}
	/>;
});
