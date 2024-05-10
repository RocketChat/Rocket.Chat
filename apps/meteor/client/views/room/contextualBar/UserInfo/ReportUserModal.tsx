import { Box, FieldGroup, Field, FieldLabel, FieldRow, FieldError, TextAreaInput } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps } from 'react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal/GenericModal';

type ReportUserModalProps = {
	onConfirm: (description: string) => void;
	onClose: () => void;
	displayName: string;
	username: string;
};

type ReportUserModalsFields = {
	description: string;
};

const ReportUserModal = ({ username, displayName, onConfirm, onClose }: ReportUserModalProps) => {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ReportUserModalsFields>({
		defaultValues: {
			description: '',
		},
	});

	const { t } = useTranslation();

	return (
		<GenericModal
			wrapperFunction={(props: ComponentProps<typeof Box>) => (
				<Box is='form' onSubmit={handleSubmit(({ description }) => onConfirm(description))} {...props} />
			)}
			variant='danger'
			title={t('Report_User')}
			onClose={onClose}
			onCancel={onClose}
			confirmText={t('Report')}
		>
			<FieldGroup>
				<Field>
					<FieldLabel>
						<Box mbe='x12' display='flex' alignItems='center'>
							<UserAvatar username={username} />
							<Box mis='x12' fontScale='p1' fontWeight='700'>
								{displayName}
							</Box>
						</Box>
					</FieldLabel>
					<FieldRow>
						<TextAreaInput
							rows={3}
							placeholder={t('Why_do_you_want_to_report_question_mark')}
							{...register('description', { required: t('Please_fill_out_reason_for_report') })}
							width='full'
							mbe='x4'
						/>
					</FieldRow>
					{errors.description && <FieldError>{errors.description.message}</FieldError>}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ReportUserModal;
