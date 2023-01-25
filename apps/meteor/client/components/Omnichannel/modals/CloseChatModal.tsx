import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Field, Button, TextInput, Modal, Box, CheckBox, Divider } from '@rocket.chat/fuselage';
import { usePermission, useSetting, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import GenericModal from '../../GenericModal';
import MarkdownText from '../../MarkdownText';
import Tags from '../Tags';

const CloseChatModal = ({
	department,
	onCancel,
	onConfirm,
}: {
	department?: ILivechatDepartment | null;
	onCancel: () => void;
	onConfirm: (
		comment?: string,
		tags?: string[],
		preferences?: { omnichannelTranscriptPDF: boolean; omnichannelTranscriptEmail: boolean },
	) => Promise<void>;
}): ReactElement => {
	const t = useTranslation();

	const {
		formState: { errors },
		handleSubmit,
		register,
		setError,
		setFocus,
		setValue,
		watch,
	} = useForm();

	const commentRequired = useSetting('Livechat_request_comment_when_closing_conversation') as boolean;
	const [tagRequired, setTagRequired] = useState(false);

	const tags = watch('tags');
	const comment = watch('comment');

	const userTranscriptEmail = useUserPreference<boolean>('omnichannelTranscriptPDF') ?? false;
	const userTranscriptPDF = useUserPreference<boolean>('omnichannelTranscriptEmail') ?? false;
	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const canSendTranscriptPDF = usePermission('request-pdf-transcript');
	const canSendTranscriptEmail = usePermission('send-omnichannel-chat-transcript');

	const canSendTranscript = canSendTranscriptEmail || (hasLicense && canSendTranscriptPDF);

	const handleTags = (value: string[]): void => {
		setValue('tags', value);
	};

	const onSubmit = useCallback(
		({ comment, tags, transcriptPDF, transcriptEmail }): void => {
			const preferences =
				transcriptPDF !== userTranscriptPDF || transcriptEmail !== userTranscriptEmail
					? {
							omnichannelTranscriptPDF: transcriptPDF,
							omnichannelTranscriptEmail: transcriptEmail,
					  }
					: undefined;

			if (!comment && commentRequired) {
				setError('comment', { type: 'custom', message: t('The_field_is_required', t('Comment')) });
			}

			if (!tags?.length && tagRequired) {
				setError('tags', { type: 'custom', message: t('error-tags-must-be-assigned-before-closing-chat') });
			}

			if (!errors.comment || errors.tags) {
				onConfirm(comment, tags, preferences);
			}
		},
		[commentRequired, userTranscriptEmail, userTranscriptPDF, tagRequired, errors, setError, t, onConfirm],
	);

	const cannotSubmit = useMemo(() => {
		const cannotSendTag = (tagRequired && !tags?.length) || errors.tags;
		const cannotSendComment = (commentRequired && !comment) || errors.comment;
		return Boolean(cannotSendTag || cannotSendComment);
	}, [comment, commentRequired, errors, tagRequired, tags]);

	useEffect(() => {
		if (department?.requestTagBeforeClosingChat) {
			setTagRequired(true);
		}
	}, [department]);

	useEffect(() => {
		if (commentRequired) {
			setFocus('comment');
		}
	}, [commentRequired, setFocus]);

	useEffect(() => {
		if (tagRequired) {
			register('tags');
		}
	}, [register, tagRequired]);

	return commentRequired || tagRequired || canSendTranscript ? (
		<Modal is='form' onSubmit={handleSubmit(onSubmit)}>
			<Modal.Header>
				<Modal.Icon name='baloon-close-top-right' />
				<Modal.Title>{t('Closing_chat')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<Box color='annotation'>{t('Close_room_description')}</Box>
				<Field marginBlock='x15'>
					<Field.Label required={commentRequired}>{t('Comment')}</Field.Label>
					<Field.Row>
						<TextInput
							{...register('comment')}
							error={
								errors.comment &&
								t('error-the-field-is-required', {
									field: t('Comment'),
								})
							}
							flexGrow={1}
							placeholder={t('Please_add_a_comment')}
						/>
					</Field.Row>
					<Field.Error>{errors.comment?.message}</Field.Error>
				</Field>
				<Field>
					<Tags tagRequired={tagRequired} tags={tags} handler={handleTags} />
					<Field.Error>{errors.tags?.message}</Field.Error>
				</Field>
				{canSendTranscript && (
					<>
						<Field>
							<Divider />
							<Field.Label>{t('Chat_transcript')}</Field.Label>
							<MarkdownText
								variant='inline'
								fontScale='c1'
								color='annotation'
								content={t('Configure_recurring_email_sending_in_My_Account_Omnichannel')}
								marginBlockStart={2}
								marginBlockEnd={8}
							/>
						</Field>
						{canSendTranscriptEmail && (
							<Field>
								<Field.Row>
									<CheckBox id='transcript-email' {...register('transcriptEmail', { value: userTranscriptEmail })} />
									<Field.Label htmlFor='transcript-email' color='default' fontScale='c1'>
										{t('Send_chat_transcript_via_email')}
									</Field.Label>
								</Field.Row>
							</Field>
						)}
						{canSendTranscriptPDF && hasLicense && (
							<Field>
								<Field.Row>
									<CheckBox id='transcript-pdf' {...register('transcriptPDF', { value: userTranscriptPDF })} />
									<Field.Label htmlFor='transcript-pdf' color='default' fontScale='c1'>
										{t('Export_chat_transcript_as_PDF')}
									</Field.Label>
								</Field.Row>
							</Field>
						)}
					</>
				)}
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button type='submit' disabled={cannotSubmit} primary>
						{t('Confirm')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	) : (
		<GenericModal
			variant='warning'
			title={t('Are_you_sure_you_want_to_close_this_chat')}
			onConfirm={(): Promise<void> => onConfirm()}
			onCancel={onCancel}
			onClose={onCancel}
			confirmText={t('Confirm')}
		></GenericModal>
	);
};

export default CloseChatModal;
