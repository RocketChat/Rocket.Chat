import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { TextAreaInput, FieldGroup, Field, FieldRow, FieldError, FieldLabel, FieldDescription, Box } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import GenericModal from '../../../../components/GenericModal';
import MarkdownText from '../../../../components/MarkdownText';
import MessageContentBody from '../../../../components/message/MessageContentBody';

type ReportMessageModalsFields = {
	description: string;
};

type ReportMessageModalProps = {
	onClose: () => void;
	message: IMessage;
};

const wordBreak = css`
	word-break: break-word;
`;

const ReportMessageModal = ({ message, onClose }: ReportMessageModalProps): ReactElement => {
	const t = useTranslation();
	const reasonForReportId = useId();
	const {
		register,
		formState: { errors },
		handleSubmit,
	} = useForm<ReportMessageModalsFields>({
		defaultValues: {
			description: '',
		},
	});
	const dispatchToastMessage = useToastMessageDispatch();
	const reportMessage = useEndpoint('POST', '/v1/chat.reportMessage');

	const { _id } = message;

	const handleReportMessage = async ({ description }: ReportMessageModalsFields): Promise<void> => {
		try {
			await reportMessage({ messageId: _id, description });
			dispatchToastMessage({ type: 'success', message: t('Report_has_been_sent') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onClose();
		}
	};

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleReportMessage)} {...props} />}
			variant='danger'
			title={t('Report_Message')}
			onClose={onClose}
			onCancel={onClose}
			confirmText={t('Report')}
		>
			<Box mbe={24} className={wordBreak}>
				{message.md ? <MessageContentBody md={message.md} /> : <MarkdownText variant='inline' parseEmoji content={message.msg} />}
			</Box>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={reasonForReportId}>{t('Report_reason')}</FieldLabel>
					<FieldDescription id={`${reasonForReportId}-description`}>{t('Let_moderators_know_what_the_issue_is')}</FieldDescription>
					<FieldRow>
						<TextAreaInput
							id={reasonForReportId}
							rows={3}
							width='full'
							mbe={4}
							aria-required='true'
							aria-describedby={`${reasonForReportId}-description ${reasonForReportId}-error`}
							{...register('description', {
								required: t('Required_field', { field: t('Reason_for_report') }),
							})}
						/>
					</FieldRow>
					{errors.description && (
						<FieldError aria-live='assertive' id={`${reasonForReportId}-error`}>
							{errors.description.message}
						</FieldError>
					)}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ReportMessageModal;
