import type { IRoom } from '@rocket.chat/core-typings';
import {
	Box,
	Button,
	Field,
	FieldLabel,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { memo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import RoomsAvailableForTeamsAutoComplete from './RoomsAvailableForTeamsAutoComplete';

type AddExistingModalFormData = {
	rooms: IRoom['_id'][];
};

type AddExistingModalProps = {
	teamId: string;
	onClose: () => void;
	reload?: () => void;
};

const AddExistingModal = ({ teamId, onClose, reload }: AddExistingModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const addRoomEndpoint = useEndpoint('POST', '/v1/teams.addRooms');

	const {
		control,
		formState: { isDirty },
		handleSubmit,
	} = useForm<AddExistingModalFormData>({ defaultValues: { rooms: [] } });

	const handleAddChannels = useCallback(
		async ({ rooms }: AddExistingModalFormData) => {
			try {
				await addRoomEndpoint({
					rooms,
					teamId,
				});

				dispatchToastMessage({ type: 'success', message: t('Channels_added') });
				reload?.();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				onClose();
			}
		},
		[addRoomEndpoint, teamId, onClose, dispatchToastMessage, reload, t],
	);

	return (
		<Modal wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleAddChannels)} {...props} />}>
			<ModalHeader>
				<ModalTitle>{t('Team_Add_existing_channels')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Field mbe={24}>
					<FieldLabel>{t('Channels')}</FieldLabel>
					<Controller
						control={control}
						name='rooms'
						render={({ field: { value, onChange } }) => <RoomsAvailableForTeamsAutoComplete value={value} onChange={onChange} />}
					/>
				</Field>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button disabled={!isDirty} type='submit' primary>
						{t('Add')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default memo(AddExistingModal);
