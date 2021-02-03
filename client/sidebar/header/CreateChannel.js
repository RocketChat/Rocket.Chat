import React from 'react';
import { Box, Modal, ButtonGroup, Button, TextInput, Icon, Field, ToggleSwitch } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
// import { useForm } from '../../hooks/useForm';

const CreateChannel = ({
	onClose,
}) => {
	const t = useTranslation();
	// const form = useForm();

	return <Modal>
		<Modal.Header>
			<Modal.Title>{t('Create_channel')}</Modal.Title>
		</Modal.Header>
		<Modal.Content>
			<Field mbe='x24'>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput addon={<Icon name='lock' size='x20' />} placeholder={t('Channel_name')} />
				</Field.Row>
			</Field>
			<Field mbe='x24'>
				<Field.Label>{t('Topic')} <Box is='span' color='neutral-600'>({t('optional')})</Box></Field.Label>
				<Field.Row>
					<TextInput addon={<Icon name='lock' size='x20' />} placeholder={t('Channel_what_is_this_channel_about')} />
				</Field.Row>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Private')}</Field.Label>
						<Field.Description>{t('Only_invited_users_can_acess_this_channel')}</Field.Description>
					</Box>
					<ToggleSwitch />
				</Box>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Read_only')}</Field.Label>
						<Field.Description>{t('All_users_in_the_channel_can_write_new_messages')}</Field.Description>
					</Box>
					<ToggleSwitch />
				</Box>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Encrypted')}</Field.Label>
						<Field.Description>{t('Encrypted_channel_Description')}</Field.Description>
					</Box>
					<ToggleSwitch />
				</Box>
			</Field>
			<Field mbe='x24'>
				<Box display='flex' justifyContent='space-between' alignItems='start'>
					<Box display='flex' flexDirection='column'>
						<Field.Label>{t('Broadcast')}</Field.Label>
						<Field.Description>{t('Broadcast_channel_Description')}</Field.Description>
					</Box>
					<ToggleSwitch />
				</Box>
			</Field>
			<Field mbe='x24'>
				<Field.Label>{`${ t('Add_members') } (${ t('optional') })`}</Field.Label>
				<Field.Row>

				</Field.Row>
			</Field>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onClose}>{t('Cancel')}</Button>
				<Button primary>{t('Create')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default CreateChannel;
