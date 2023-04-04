import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Button, Field, Modal } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useCallback } from 'react';

import { useForm } from '../../../../../hooks/useForm';
import RoomsAvailableForTeamsAutoComplete from './RoomsAvailableForTeamsAutoComplete';

type AddExistingModalProps = {
	teamId: string;
	onClose: () => void;
	reload: () => void;
};

const AddExistingModal = ({ onClose, teamId, reload }: AddExistingModalProps) => {
	const t = useTranslation();

	const addRoomEndpoint = useEndpoint('POST', '/v1/teams.addRooms');
	const dispatchToastMessage = useToastMessageDispatch();

	const { values, handlers, hasUnsavedChanges } = useForm({
		rooms: [] as Serialized<IRoom>[],
	});

	const { rooms } = values as { rooms: string[] };
	const { handleRooms } = handlers;

	const handleAddChannels = useCallback(async () => {
		try {
			await addRoomEndpoint({
				rooms,
				teamId,
			});

			dispatchToastMessage({ type: 'success', message: t('Channels_added') });
			reload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onClose();
		}
	}, [addRoomEndpoint, rooms, teamId, onClose, dispatchToastMessage, t, reload]);

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Team_Add_existing_channels')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Field mbe='x24'>
					<Field.Label>{t('Channels')}</Field.Label>
					<RoomsAvailableForTeamsAutoComplete value={rooms} onChange={handleRooms} />
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!hasUnsavedChanges} onClick={handleAddChannels} primary>
						{t('Add')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(AddExistingModal);
