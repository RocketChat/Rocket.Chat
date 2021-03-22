import React, { memo, FC, useCallback } from 'react';
import { Box, ButtonGroup, Button, Field, Modal } from '@rocket.chat/fuselage';

import { useForm } from '../../../../hooks/useForm';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useEndpoint } from '../../../../contexts/ServerContext';
import ChannelsInput from './ChannelsInput';

type ExistingModalState = {
	onAdd: any;
	channels: any;
	onChangeChannels: any;
	hasUnsavedChanges: boolean;
}

type AddExistingModalProps = {
	onClose: () => void;
	teamId: string;
};

const useExistingModalState = (onClose: () => void, teamId: string): ExistingModalState => {
	const addRoomEndpoint = useEndpoint('POST', 'teams.addRooms');

	const { values, handlers, hasUnsavedChanges } = useForm({
		channels: [],
	});

	const { channels } = values as {channels: string[]};
	const { handleChannels } = handlers;

	const onChangeChannels = useCallback((value: any, action: string) => {
		if (!action) {
			if (channels.filter((current: any) => current._id === value._id).length > 0) {
				return;
			}
			return handleChannels([...channels, value]);
		}
		handleChannels(channels.filter((current: any) => current._id !== value));
	}, [handleChannels, channels]);

	const onAdd = useCallback(() => {
		addRoomEndpoint({
			rooms: channels,
			teamId,
		});
		onClose();
	}, [addRoomEndpoint, channels, onClose, teamId]);

	return { onAdd, channels, onChangeChannels, hasUnsavedChanges };
};

const AddExistingModal: FC<AddExistingModalProps> = ({ onClose, teamId }) => {
	const t = useTranslation();
	const { onAdd, channels, onChangeChannels, hasUnsavedChanges } = useExistingModalState(onClose, teamId);

	const isAddButtonEnabled = hasUnsavedChanges;

	return <Modal>
		<Modal.Header>
			<Modal.Title>{t('Team_Add_existing_channels')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content>
			<Field mbe='x24'>
				<Field.Label>{t('Teams_New_Add_members_Label')} <Box is='span' color='neutral-600'>({t('optional')})</Box></Field.Label>
				<ChannelsInput value={channels} onChange={onChangeChannels} />
			</Field>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onClose}>{t('Cancel')}</Button>
				<Button disabled={!isAddButtonEnabled} onClick={onAdd} primary>{t('Add')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default memo(AddExistingModal);
