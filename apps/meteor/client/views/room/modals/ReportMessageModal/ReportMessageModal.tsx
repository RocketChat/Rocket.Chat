import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { TextAreaInput, FieldGroup, Field, FieldRow, FieldError, FieldLabel, FieldDescription, Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

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
	const { t } = useTranslation();
	const reasonForReportId = useId();
	const {
		control,
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
			title={t('Report_message')}
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
						<Controller
							rules={{ required: t('Required_field', { field: t('Report_reason') }) }}
							name='description'
							control={control}
							render={({ field }) => (
								<TextAreaInput
									{...field}
									id={reasonForReportId}
									rows={3}
									aria-required='true'
									aria-invalid={!!errors.description}
									aria-describedby={`${reasonForReportId}-description ${reasonForReportId}-error`}
								/>
							)}
						/>
					</FieldRow>
					{errors.description && (
						<FieldError role='alert' id={`${reasonForReportId}-error`}>
							{errors.description.message}
						</FieldError>
					)}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ReportMessageModal;
