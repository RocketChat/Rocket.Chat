import React, { memo, FC, useCallback } from 'react';
import { ButtonGroup, Button, Field, Modal } from '@rocket.chat/fuselage';

import { useForm } from '../../../../hooks/useForm';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useEndpoint } from '../../../../contexts/ServerContext';
import RoomsInput from './RoomsInput';
import { IRoom } from '../../../../../definition/IRoom';

type AddExistingModalState = {
	onAdd: any;
	channels: IRoom[];
	onChangeChannels: any;
	hasUnsavedChanges: boolean;
}

type AddExistingModalProps = {
	onClose: () => void;
	teamId: string;
};

const useAddExistingModalState = (onClose: () => void, teamId: string): AddExistingModalState => {
	const addRoomEndpoint = useEndpoint('POST', 'teams.addRooms');

	const { values, handlers, hasUnsavedChanges } = useForm({
		channels: [] as IRoom[],
	});

	const { channels } = values as { channels: IRoom[] };
	const { handleChannels } = handlers;

	const onChangeChannels = useCallback((value: IRoom, action: string) => {
		if (!action) {
			if (channels.some((current: IRoom) => current._id === value._id)) {
				return;
			}

			handleChannels([...channels, value]);

			return;
		}

		handleChannels(channels.filter((current: any) => current._id !== value));
	}, [handleChannels, channels]);

	const onAdd = useCallback(() => {
		addRoomEndpoint({
			rooms: channels.map((channel) => channel._id),
			teamId,
		});
		onClose();
	}, [addRoomEndpoint, channels, onClose, teamId]);

	return { onAdd, channels, onChangeChannels, hasUnsavedChanges };
};

const AddExistingModal: FC<AddExistingModalProps> = ({ onClose, teamId }) => {
	const t = useTranslation();
	const {
		channels,
		onAdd,
		onChangeChannels,
		hasUnsavedChanges,
	} = useAddExistingModalState(onClose, teamId);

	const isAddButtonEnabled = hasUnsavedChanges;

	return <Modal>
		<Modal.Header>
			<Modal.Title>{t('Team_Add_existing_channels')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content>
			<Field mbe='x24'>
				<Field.Label>{t('Channels')}</Field.Label>
				<RoomsInput value={channels} onChange={onChangeChannels} />
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
