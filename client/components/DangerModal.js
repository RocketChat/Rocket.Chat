import { Icon, Button, Modal, ButtonGroup } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React from 'react';

const DangerModal = ({
	onConfirm,
	onClose,
	onCancel,
	children,
	title,
	secondaryButtonText,
	confirmButtonText,
	...props
}) => {
	const ref = useAutoFocus(true);

	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{title}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content>
			{children}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				{onCancel && <Button ref={ref} ghost onClick={onCancel}>{secondaryButtonText}</Button>}
				<Button {...!onCancel && { ref }} primary danger onClick={onConfirm}>{confirmButtonText}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default DangerModal;
