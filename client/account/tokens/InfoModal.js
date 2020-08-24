import React from 'react';
import { Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';

const InfoModal = ({ title, content, icon, onConfirm, onClose, confirmText, cancelText, ...props }) =>
	<Modal {...props}>
		<Modal.Header>
			{icon}
			<Modal.Title>{title}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{content}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				{cancelText && <Button onClick={onClose}>{cancelText}</Button>}
				{confirmText && onConfirm && <Button primary onClick={onConfirm}>{confirmText}</Button>}
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;

export default InfoModal;
