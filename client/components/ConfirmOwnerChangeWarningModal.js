import React from 'react';
import { Box, Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';

import RawText from './basic/RawText';
import { useTranslation } from '../contexts/TranslationContext';

const ConfirmOwnerChangeWarningModal = ({ onConfirm, onCancel, contentTitle = '', confirmLabel = '', shouldChangeOwner, shouldBeRemoved, ...props }) => {
	const t = useTranslation();

	let changeOwnerRooms = '';
	if (shouldChangeOwner.length > 0) {
		if (shouldChangeOwner.length === 1) {
			changeOwnerRooms = t('A_new_owner_will_be_assigned_automatically_to_the__roomName__room', { roomName: shouldChangeOwner.pop() });
		} else if (shouldChangeOwner.length <= 5) {
			changeOwnerRooms = t('A_new_owner_will_be_assigned_automatically_to_those__count__rooms__rooms__', { count: shouldChangeOwner.length, rooms: shouldChangeOwner.join(', ') });
		} else {
			changeOwnerRooms = t('A_new_owner_will_be_assigned_automatically_to__count__rooms', { count: shouldChangeOwner.length });
		}
	}

	let removedRooms = '';
	if (shouldBeRemoved.length > 0) {
		if (shouldBeRemoved.length === 1) {
			removedRooms = t('The_empty_room__roomName__will_be_removed_automatically', { roomName: shouldBeRemoved.pop() });
		} else if (shouldBeRemoved.length <= 5) {
			removedRooms = t('__count__empty_rooms_will_be_removed_automatically__rooms__', { count: shouldBeRemoved.length, rooms: shouldBeRemoved.join(', ') });
		} else {
			removedRooms = t('__count__empty_rooms_will_be_removed_automatically', { count: shouldBeRemoved.length });
		}
	}

	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{contentTitle}

			{ changeOwnerRooms && <Box marginBlock='x16'><RawText>{changeOwnerRooms}</RawText></Box> }
			{ removedRooms && <Box marginBlock='x16'><RawText>{removedRooms}</RawText></Box> }
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onConfirm}>{confirmLabel}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default ConfirmOwnerChangeWarningModal;
