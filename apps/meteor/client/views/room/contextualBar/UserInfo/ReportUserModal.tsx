import { Box, Button, Modal, TextAreaInput } from '@rocket.chat/fuselage';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useUserDisplayName } from '../../../../hooks/useUserDisplayName';

type ReportUserModalProps = {
	onConfirm: (description: string) => void;
	onClose: () => void;
	uid: string;
	username: string;
	name: string | undefined;
};

const ReportUserModal = ({ username, name, onConfirm, onClose }: ReportUserModalProps) => {
	const { register, getValues } = useForm({
		defaultValues: {
			description: '',
		},
	});

	const onClickConfirm = () => {
		const { description } = getValues();
		onConfirm(description);
		onClose();
	};

	const displayName = useUserDisplayName({ username, name });
	const { t } = useTranslation();

	return (
		<Modal>
			<Modal.Header>
				<Modal.Icon name='warning' color='danger' />
				<Modal.HeaderText fontScale='h3'>{t('Report_User')}</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box mbe='x16' fontWeight='bold'>
					<UserAvatar username={username} /> {displayName}
				</Box>
				<TextAreaInput
					rows={3}
					placeholder={t('Why_do_you_want_to_report_question_mark')}
					{...register('description', { required: t('Please_provide_a_reason') })}
					width='full'
					mbe='x4'
				/>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button danger onClick={onClickConfirm}>
						{t('Report')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default ReportUserModal;
