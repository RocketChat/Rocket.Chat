import { FieldGroup, Field, FieldLabel, FieldRow, FieldError, TextAreaInput, FieldDescription, Stack, Text } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { GenericModal } from '@rocket.chat/ui-client';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type ReportUserModalProps = {
	onConfirm: (reasonForReport: string) => void;
	onClose: () => void;
	displayName: string;
	username: string;
};

type ReportUserModalsFields = {
	reasonForReport: string;
};

const ReportUserModal = ({ username, displayName, onConfirm, onClose }: ReportUserModalProps) => {
	'use no memo';

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
			onSubmit={handleSubmit(({ reasonForReport }) => onConfirm(reasonForReport))}
			variant='danger'
			title={t('Report_User')}
			onClose={onClose}
			onCancel={onClose}
			confirmText={t('Report')}
		>
			<Stack gap='x16'>
				<Stack direction='row' align='center' gap='x8'>
					<UserAvatar username={username} />
					<Text fontScale='p2b'>{displayName}</Text>
				</Stack>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={reasonForReportId}>{t('Report_reason')}</FieldLabel>
						<FieldDescription id={`${reasonForReportId}-description`}>{t('Let_moderators_know_what_the_issue_is')}</FieldDescription>
						<FieldRow>
							<TextAreaInput
								id={reasonForReportId}
								rows={3}
								{...register('reasonForReport', { required: t('Required_field', { field: t('Reason_for_report') }) })}
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
			</Stack>
		</GenericModal>
	);
};

export default ReportUserModal;
