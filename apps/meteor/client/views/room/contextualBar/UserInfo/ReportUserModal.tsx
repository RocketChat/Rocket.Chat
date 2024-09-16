import { Box, FieldGroup, Field, FieldLabel, FieldRow, FieldError, TextAreaInput } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps } from 'react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal/GenericModal';

type ReportUserModalProps = {
	onConfirm: (reasonForReport: string) => void;
	onClose: () => void;
	displayName: string;
	username: string;
};

type ReportUserModalsFields = {
	reasonForReport: string;
};

const ReportUserModal = ({ username, displayName, onConfirm, onClose }: ReportUserModalProps) => {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ReportUserModalsFields>({
		defaultValues: {
			reasonForReport: '',
		},
	});

	const { t } = useTranslation();

	const reasonForReportId = useUniqueId();

	return (
		<GenericModal
			wrapperFunction={(props: ComponentProps<typeof Box>) => (
				<Box is='form' onSubmit={handleSubmit(({ reasonForReport }) => onConfirm(reasonForReport))} {...props} />
			)}
			variant='danger'
			title={t('Report_User')}
			onClose={onClose}
			onCancel={onClose}
			confirmText={t('Report')}
		>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={reasonForReportId}>
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
							{...register('reasonForReport', { required: t('Required_field', { field: t('Reason_for_report') }) })}
							width='full'
							mbe='x4'
							aria-label={t('Reason_for_report')}
						/>
					</FieldRow>
					{errors.reasonForReport && <FieldError>{errors.reasonForReport.message}</FieldError>}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ReportUserModal;
