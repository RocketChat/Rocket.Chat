import { Box, FieldGroup, Field, FieldLabel, FieldRow, FieldError, TextAreaInput, FieldDescription } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useId, type ComponentProps } from 'react';
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

	const reasonForReportId = useId();

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
			<Box mbe={16} display='flex' alignItems='center'>
				<UserAvatar username={username} />
				<Box mis={8} fontScale='p2b'>
					{displayName}
				</Box>
			</Box>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={reasonForReportId}>{t('Report_reason')}</FieldLabel>
					<FieldDescription id={`${reasonForReportId}-description`}>{t('Let_moderators_know_what_the_issue_is')}</FieldDescription>
					<FieldRow>
						<TextAreaInput
							id={reasonForReportId}
							rows={3}
							{...register('reasonForReport', { required: t('Required_field', { field: t('Reason_for_report') }) })}
							width='full'
							mbe={4}
							aria-required='true'
							aria-describedby={`${reasonForReportId}-description ${reasonForReportId}-error`}
						/>
					</FieldRow>
					{errors.reasonForReport && (
						<FieldError aria-live='assertive' id={`${reasonForReportId}-error`}>
							{errors.reasonForReport.message}
						</FieldError>
					)}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ReportUserModal;
