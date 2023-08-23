import { Box, Button, Field, Modal } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';

import RoomsAvailableForTeamsAutoComplete from './RoomsAvailableForTeamsAutoComplete';

type AddExistingModalProps = {
	teamId: string;
	onClose: () => void;
};

const AddExistingModal = ({ onClose, teamId }: AddExistingModalProps) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const addRoomEndpoint = useEndpoint('POST', '/v1/teams.addRooms');

	const {
		control,
		formState: { isDirty },
		handleSubmit,
	} = useForm({ defaultValues: { rooms: [] } });

	const handleAddChannels = useCallback(
		async ({ rooms }) => {
			try {
				await addRoomEndpoint({
					rooms,
					teamId,
				});

				dispatchToastMessage({ type: 'success', message: t('Channels_added') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				onClose();
			}
		},
		[addRoomEndpoint, teamId, onClose, dispatchToastMessage, t],
	);

	return (
		<Modal wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleAddChannels)} {...props} />}>
			<Modal.Header>
				<Modal.Title>{t('Team_Add_existing_channels')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Field mbe={24}>
					<Field.Label>{t('Channels')}</Field.Label>
					<Controller
						control={control}
						name='rooms'
						render={({ field: { value, onChange } }) => <RoomsAvailableForTeamsAutoComplete value={value} onChange={onChange} />}
					/>
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!isDirty} type='submit' primary>
						{t('Add')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(AddExistingModal);
