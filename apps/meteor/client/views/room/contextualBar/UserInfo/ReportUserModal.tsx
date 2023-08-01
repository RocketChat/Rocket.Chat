import { Box, Button, FieldGroup, Field, Modal, TextAreaInput } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
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

type ReportUserModalsFields = {
	description: string;
};

const ReportUserModal = ({ username, name, onConfirm, onClose }: ReportUserModalProps) => {
	const {
		register,
		getValues,
		handleSubmit,
		formState: { errors },
	} = useForm<ReportUserModalsFields>({
		defaultValues: {
			description: '',
		},
	});

	const onClickConfirm = () => {
		const { description } = getValues();
		onConfirm(description);
	};

	const displayName = useUserDisplayName({ username, name });
	const { t } = useTranslation();

	return (
		<Modal wrapperFunction={(props: ComponentProps<typeof Box>) => <Box is='form' onSubmit={handleSubmit(onClickConfirm)} {...props} />}>
			<Modal.Header>
				<Modal.Icon name='warning' color='danger' />
				<Modal.HeaderText fontScale='h3'>{t('Report_User')}</Modal.HeaderText>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<Field.Label>
							<Box mbe='x12' display='flex' alignItems='center'>
								<UserAvatar username={username} />
								<Box mis='x12' fontWeight='bold'>
									{displayName}
								</Box>
							</Box>
						</Field.Label>
						<Field.Row>
							<TextAreaInput
								rows={3}
								placeholder={t('Why_do_you_want_to_report_question_mark')}
								{...register('description', { required: t('Please_fill_out_reason_for_report') })}
								width='full'
								mbe='x4'
							/>
						</Field.Row>
						{errors.description && <Field.Error>{errors.description.message}</Field.Error>}
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button danger type='submit'>
						{t('Report')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default ReportUserModal;
