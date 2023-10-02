import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { TextAreaInput, FieldGroup, Field, Box } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation, useMethod } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
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
	const {
		register,
		formState: { errors },
		handleSubmit,
	} = useForm<ReportMessageModalsFields>();
	const dispatchToastMessage = useToastMessageDispatch();
	const reportMessage = useMethod('reportMessage');

	const { _id } = message;

	const handleReportMessage = async ({ description }: ReportMessageModalsFields): Promise<void> => {
		try {
			await reportMessage(_id, description);
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
			title={t('Report_this_message_question_mark')}
			onClose={onClose}
			onCancel={onClose}
			confirmText={t('Report_exclamation_mark')}
		>
			<Box mbe={24} className={wordBreak}>
				{message.md ? <MessageContentBody md={message.md} /> : <MarkdownText variant='inline' parseEmoji content={message.msg} />}
			</Box>
			<FieldGroup>
				<Field>
					<Field.Row>
						<TextAreaInput {...register('description', { required: true })} placeholder={t('Why_do_you_want_to_report_question_mark')} />
					</Field.Row>
					{errors.description && <Field.Error>{t('You_need_to_write_something')}</Field.Error>}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ReportMessageModal;
