import { Box, Button, Modal, TextAreaInput } from '@rocket.chat/fuselage';
import React from 'react';
import { useForm } from 'react-hook-form';

import UserAvatar from '/client/components/avatar/UserAvatar';

type ReportUserModalProps = {
	onConfirm: () => void;
	onCancel: () => void;
	uid: string;
	username: string;
};

const ReportUserModal = ({ username, onConfirm, onCancel }: ReportUserModalProps) => {
	const { register } = useForm({
		defaultValues: {
			reportReason: '',
		},
	});

	return (
		<Modal>
			<Modal.Header>
				<Modal.Icon name='warning' color='danger' />
				<Modal.HeaderText fontScale='h3'>Report User</Modal.HeaderText>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content>
				<Box mbe='x16' fontWeight='bold'>
					<UserAvatar username={username} /> username
				</Box>
				<TextAreaInput rows={3} placeholder='Why do you want to report' {...register('reportReason')} width='full' />
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={onCancel}>
						Cancel
					</Button>
					<Button danger onClick={onConfirm}>
						Report
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default ReportUserModal;
