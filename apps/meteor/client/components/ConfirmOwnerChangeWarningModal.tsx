import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import GenericModal from './GenericModal';
import RawText from './RawText';

type ConfirmOwnerChangeWarningModalProps = {
	onConfirm: () => void;
	onCancel: () => void;
	shouldChangeOwner: Array<string>;
	shouldBeRemoved: Array<string>;
	contentTitle: string;
	confirmLabel: string;
};

const ConfirmOwnerChangeWarningModal: FC<ConfirmOwnerChangeWarningModalProps> = ({
	onConfirm,
	onCancel,
	contentTitle = '',
	confirmLabel = '',
	shouldChangeOwner,
	shouldBeRemoved,
}) => {
	const t = useTranslation();

	let changeOwnerRooms = '';
	if (shouldChangeOwner.length > 0) {
		if (shouldChangeOwner.length === 1) {
			changeOwnerRooms = t('A_new_owner_will_be_assigned_automatically_to_the__roomName__room', {
				roomName: shouldChangeOwner.pop(),
			});
		} else if (shouldChangeOwner.length <= 5) {
			changeOwnerRooms = t('A_new_owner_will_be_assigned_automatically_to_those__count__rooms__rooms__', {
				count: shouldChangeOwner.length,
				rooms: shouldChangeOwner.join(', '),
			});
		} else {
			changeOwnerRooms = t('A_new_owner_will_be_assigned_automatically_to__count__rooms', {
				count: shouldChangeOwner.length,
			});
		}
	}

	let removedRooms = '';
	if (shouldBeRemoved.length > 0) {
		if (shouldBeRemoved.length === 1) {
			removedRooms = t('The_empty_room__roomName__will_be_removed_automatically', {
				roomName: shouldBeRemoved.pop(),
			});
		} else if (shouldBeRemoved.length <= 5) {
			removedRooms = t('__count__empty_rooms_will_be_removed_automatically__rooms__', {
				count: shouldBeRemoved.length,
				rooms: shouldBeRemoved.join(', '),
			});
		} else {
			removedRooms = t('__count__empty_rooms_will_be_removed_automatically', {
				count: shouldBeRemoved.length,
			});
		}
	}

	return (
		<GenericModal variant='danger' onClose={onCancel} onCancel={onCancel} confirmText={confirmLabel} onConfirm={onConfirm}>
			{contentTitle}

			{changeOwnerRooms && (
				<Box marginBlock='x16'>
					<RawText>{changeOwnerRooms}</RawText>
				</Box>
			)}
			{removedRooms && (
				<Box marginBlock='x16'>
					<RawText>{removedRooms}</RawText>
				</Box>
			)}
		</GenericModal>
	);
};

export default ConfirmOwnerChangeWarningModal;
