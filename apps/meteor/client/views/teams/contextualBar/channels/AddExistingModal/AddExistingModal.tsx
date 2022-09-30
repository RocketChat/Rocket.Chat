import type { IRoom } from '@rocket.chat/core-typings';
import { Serialized } from '@rocket.chat/core-typings';
import { Button, Field, Modal } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, FC, useCallback } from 'react';

import { useForm } from '../../../../../hooks/useForm';
import RoomsInput from './RoomsInput';

type AddExistingModalState = {
	onAdd: any;
	rooms: Serialized<IRoom>[];
	onChange: (value: Serialized<IRoom>, action: 'remove' | undefined) => void;
	hasUnsavedChanges: boolean;
};

type AddExistingModalProps = {
	onClose: () => void;
	teamId: string;
	reload: () => void;
};

const useAddExistingModalState = (onClose: () => void, teamId: string, reload: () => void): AddExistingModalState => {
	const t = useTranslation();
	const addRoomEndpoint = useEndpoint('POST', '/v1/teams.addRooms');
	const dispatchToastMessage = useToastMessageDispatch();

	const { values, handlers, hasUnsavedChanges } = useForm({
		rooms: [] as Serialized<IRoom>[],
	});

	const { rooms } = values as { rooms: Serialized<IRoom>[] };
	const { handleRooms } = handlers;

	const onChange = useCallback<AddExistingModalState['onChange']>(
		(value, action) => {
			if (!action) {
				if (rooms.some((current) => current._id === value._id)) {
					return;
				}

				return handleRooms([...rooms, value]);
			}

			handleRooms(rooms.filter((current: any) => current._id !== value._id));
		},
		[handleRooms, rooms],
	);

	const onAdd = useCallback(async () => {
		try {
			await addRoomEndpoint({
				rooms: rooms.map((room) => room._id),
				teamId,
			});

			dispatchToastMessage({ type: 'success', message: t('Channels_added') });
			onClose();
			reload();
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [addRoomEndpoint, rooms, teamId, onClose, dispatchToastMessage, t, reload]);

	return { onAdd, rooms, onChange, hasUnsavedChanges };
};

const AddExistingModal: FC<AddExistingModalProps> = ({ onClose, teamId, reload }) => {
	const t = useTranslation();
	const { rooms, onAdd, onChange, hasUnsavedChanges } = useAddExistingModalState(onClose, teamId, reload);

	const isAddButtonEnabled = hasUnsavedChanges;

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Team_Add_existing_channels')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Field mbe='x24'>
					<Field.Label>{t('Channels')}</Field.Label>
					<RoomsInput value={rooms} onChange={onChange} />
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!isAddButtonEnabled} onClick={onAdd} primary>
						{t('Add')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(AddExistingModal);
