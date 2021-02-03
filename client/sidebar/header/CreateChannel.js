import React, { memo, useCallback } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Box, Modal, ButtonGroup, Button, TextInput, Icon, Field, ToggleSwitch } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useForm } from '../../hooks/useForm';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';
import UserAutoCompleteMultiple from '../../../ee/client/audit/UserAutoCompleteMultiple';

export const CreateChannel = ({
	values,
	handlers,
	onChangeUsers,
	onCreate,
	onClose,
}) => {
	const t = useTranslation();

	return <Modal>
		<Modal.Header>
			<Modal.Title>{t('Create_channel')}</Modal.Title>
		</Modal.Header>
		<Modal.Content>
			<Field mbe='x24'>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput addon={<Icon name='lock' size='x20' />} placeholder={t('Channel_name')} onChange={handlers.handleName}/>
				</Field.Row>
			</Field>
			<Field mbe='x24'>
				<Field.Label>{t('Topic')} <Box is='span' color='neutral-600'>({t('optional')})</Box></Field.Label>
				<Field.Row>
					<TextInput addon={<Icon name='lock' size='x20' />} placeholder={t('Channel_what_is_this_channel_about')} onChange={handlers.handleDescription}/>
				</Field.Row>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Private')}</Field.Label>
						<Field.Description>{values.type ? t('Only_invited_users_can_acess_this_channel') : t('Everyone_can_access_this_channel')}</Field.Description>
					</Box>
					<ToggleSwitch onChange={handlers.handleType}/>
				</Box>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Read_only')}</Field.Label>
						<Field.Description>{t('All_users_in_the_channel_can_write_new_messages')}</Field.Description>
					</Box>
					<ToggleSwitch onChange={handlers.handleReadOnly}/>
				</Box>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Encrypted')}</Field.Label>
						<Field.Description>{t('Encrypted_channel_Description')}</Field.Description>
					</Box>
					<ToggleSwitch onChange={handlers.handleEncrypted} />
				</Box>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Broadcast')}</Field.Label>
						<Field.Description>{t('Broadcast_channel_Description')}</Field.Description>
					</Box>
					<ToggleSwitch onChange={handlers.handleBroadcast} />
				</Box>
			</Field>
			<Field mbe='x24'>
				<Field.Label>{`${ t('Add_members') } (${ t('optional') })`}</Field.Label>
				<Field.Row>
					<UserAutoCompleteMultiple value={values.users} onChange={onChangeUsers}/>
				</Field.Row>
			</Field>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onClose}>{t('Cancel')}</Button>
				<Button onClick={onCreate} primary>{t('Create')}</Button>
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

	const initialValues = {
		users: [],
		name: '',
		description: '',
		type: false,
		readOnly: false,
		encrypted: false,
		broadcast: false,
	};
	const { values, handlers } = useForm(initialValues);

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

	const onCreate = useCallback(async () => {
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
		} else {
			roomData = await createChannel(params);
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
		onChangeUsers={onChangeUsers}
		onClose={onClose}
		onCreate={onCreate}
	/>;
});
