import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { TextAreaInput, FieldGroup, Field, Box } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation, useMethod } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { useForm } from 'react-hook-form';

import GenericModal from '../../../../components/GenericModal';

type ReportMessageModalsFields = {
	description: string;
};

type ReportMessageModalProps = {
	onClose: () => void;
	messageText?: string;
	messageId: IMessage['_id'];
};

const wordBreak = css`
	word-break: break-word;
`;

const ReportMessageModal = ({ messageText, messageId, onClose }: ReportMessageModalProps): ReactElement => {
	const t = useTranslation();
	const {
		register,
		formState: { errors },
		handleSubmit,
	} = useForm<ReportMessageModalsFields>();
	const dispatchToastMessage = useToastMessageDispatch();
	const reportMessage = useMethod('reportMessage');

	const handleReportMessage = async ({ description }: ReportMessageModalsFields): Promise<void> => {
		try {
			await reportMessage(messageId, description);
			dispatchToastMessage({ type: 'success', message: t('Report_has_been_sent') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onClose();
		}
	};

	return (
		<GenericModal
			variant='danger'
			title={t('Report_this_message_question_mark')}
			onClose={onClose}
			onCancel={onClose}
			onConfirm={handleSubmit(handleReportMessage)}
			confirmText={t('Report_exclamation_mark')}
		>
			<Box mbe='x24' className={wordBreak}>
				{messageText}
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
