import React, { memo, FC, useCallback } from 'react';
import { ButtonGroup, Button, Field, Modal } from '@rocket.chat/fuselage';

import { useForm } from '../../../../hooks/useForm';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useEndpoint } from '../../../../contexts/ServerContext';
import RoomsInput from './RoomsInput';
import { IRoom } from '../../../../../definition/IRoom';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';

type AddExistingModalState = {
	onAdd: any;
	rooms: IRoom[];
	onChange: (value: IRoom, action: 'remove' | undefined) => void;
	hasUnsavedChanges: boolean;
}

type AddExistingModalProps = {
	onClose: () => void;
	teamId: string;
};

const useAddExistingModalState = (onClose: () => void, teamId: string): AddExistingModalState => {
	const t = useTranslation();
	const addRoomEndpoint = useEndpoint('POST', 'teams.addRooms');

	const { values, handlers, hasUnsavedChanges } = useForm({
		rooms: [] as IRoom[],
	});

	const { rooms } = values as { rooms: IRoom[] };
	const { handleRooms } = handlers;

	const onChange = useCallback<AddExistingModalState['onChange']>((value, action) => {
		if (!action) {
			if (rooms.some((current: IRoom) => current._id === value._id)) {
				return;
			}

			handleRooms([...rooms, value]);

			return;
		}

		handleRooms(rooms.filter((current: any) => current._id !== value._id));
	}, [handleRooms, rooms]);

	const dispatchToastMessage = useToastMessageDispatch();

	const onAdd = useCallback(async () => {
		try {
			await addRoomEndpoint({
				rooms: rooms.map((room) => room._id),
				teamId,
			});

			dispatchToastMessage({ type: 'success', message: t('Channels_added') });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [addRoomEndpoint, rooms, teamId, onClose, dispatchToastMessage, t]);

	return { onAdd, rooms, onChange, hasUnsavedChanges };
};

const AddExistingModal: FC<AddExistingModalProps> = ({ onClose, teamId }) => {
	const t = useTranslation();
	const {
		rooms,
		onAdd,
		onChange,
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
				<RoomsInput value={rooms} onChange={onChange} />
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
