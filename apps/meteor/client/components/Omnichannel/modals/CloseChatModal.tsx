import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Field, FieldGroup, Button, TextInput, Modal, Box, CheckBox, Divider, EmailInput } from '@rocket.chat/fuselage';
import { usePermission, useSetting, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import { dispatchToastMessage } from '../../../lib/toast';
import GenericModal from '../../GenericModal';
import Tags from '../Tags';

const CloseChatModal = ({
	department,
	visitorEmail,
	onCancel,
	onConfirm,
}: {
	department?: ILivechatDepartment | null;
	visitorEmail?: string;
	onCancel: () => void;
	onConfirm: (
		comment?: string,
		tags?: string[],
		preferences?: { omnichannelTranscriptPDF: boolean; omnichannelTranscriptEmail: boolean },
		requestData?: { email: string; subject: string },
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
	const transcriptEmail = watch('transcriptEmail');
	const subject = watch('subject');

	const userTranscriptEmail = useUserPreference<boolean>('omnichannelTranscriptEmail') ?? false;
	const userTranscriptPDF = useUserPreference<boolean>('omnichannelTranscriptPDF') ?? false;
	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const transcriptPDFPermission = usePermission('request-pdf-transcript');
	const transcriptEmailPermission = usePermission('send-omnichannel-chat-transcript');

	const canSendTranscriptEmail = transcriptEmailPermission && visitorEmail;
	const canSendTranscriptPDF = transcriptPDFPermission && hasLicense;
	const canSendTranscript = canSendTranscriptEmail || canSendTranscriptPDF;

	const handleTags = (value: string[]): void => {
		setValue('tags', value);
	};

	const onSubmit = useCallback(
		({ comment, tags, transcriptPDF, transcriptEmail, subject }): void => {
			const preferences = {
				omnichannelTranscriptPDF: !!transcriptPDF,
				omnichannelTranscriptEmail: !!transcriptEmail,
			};
			const requestData = transcriptEmail && visitorEmail ? { email: visitorEmail, subject } : undefined;

			if (!comment && commentRequired) {
				setError('comment', { type: 'custom', message: t('The_field_is_required', t('Comment')) });
			}

			if (transcriptEmail && !subject) {
				setError('subject', { type: 'custom', message: t('The_field_is_required', t('Subject')) });
			}

			if (!tags?.length && tagRequired) {
				setError('tags', { type: 'custom', message: t('error-tags-must-be-assigned-before-closing-chat') });
			}

			if (!errors.comment || errors.tags) {
				onConfirm(comment, tags, preferences, requestData);
			}
		},
		[commentRequired, tagRequired, visitorEmail, errors, setError, t, onConfirm],
	);

	const cannotSubmit = useMemo(() => {
		const cannotSendTag = (tagRequired && !tags?.length) || errors.tags;
		const cannotSendComment = (commentRequired && !comment) || errors.comment;
		const cannotSendTranscriptEmail = transcriptEmail && (!visitorEmail || !subject);

		return Boolean(cannotSendTag || cannotSendComment || cannotSendTranscriptEmail);
	}, [comment, commentRequired, errors, tagRequired, tags, transcriptEmail, visitorEmail, subject]);

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

	useEffect(() => {
		if (transcriptEmail) {
			if (!visitorEmail) {
				dispatchToastMessage({ type: 'error', message: t('Customer_without_registered_email') });
				return;
			}
			setValue('subject', subject || t('Transcript_of_your_livechat_conversation'));
		}
	}, [transcriptEmail, setValue, visitorEmail, subject, t]);

	return commentRequired || tagRequired || canSendTranscript ? (
		<Modal wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(onSubmit)} {...props} />}>
			<Modal.Header>
				<Modal.Icon name='baloon-close-top-right' />
				<Modal.Title>{t('Wrap_up_conversation')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<Box color='annotation'>{t('Close_room_description')}</Box>
				<FieldGroup>
					<Field>
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
						<Tags tagRequired={tagRequired} tags={tags} handler={handleTags} {...(department && { department: department._id })} />
						<Field.Error>{errors.tags?.message}</Field.Error>
					</Field>
					{canSendTranscript && (
						<>
							<Field>
								<Divider />
								<Field.Label marginBlockStart={8}>{t('Chat_transcript')}</Field.Label>
							</Field>
							{canSendTranscriptPDF && (
								<Field marginBlockStart={10}>
									<Field.Row>
										<CheckBox id='transcript-pdf' {...register('transcriptPDF', { value: userTranscriptPDF })} />
										<Field.Label htmlFor='transcript-pdf' color='default' fontScale='c1'>
											{t('Omnichannel_transcript_pdf')}
										</Field.Label>
									</Field.Row>
								</Field>
							)}
							{canSendTranscriptEmail && (
								<>
									<Field marginBlockStart={10}>
										<Field.Row>
											<CheckBox id='transcript-email' {...register('transcriptEmail', { value: userTranscriptEmail })} />
											<Field.Label htmlFor='transcript-email' color='default' fontScale='c1'>
												{t('Omnichannel_transcript_email')}
											</Field.Label>
										</Field.Row>
									</Field>
									{transcriptEmail && (
										<>
											<Field marginBlockStart={14}>
												<Field.Label required>{t('Contact_email')}</Field.Label>
												<Field.Row>
													<EmailInput value={visitorEmail} required disabled flexGrow={1} />
												</Field.Row>
											</Field>
											<Field marginBlockStart={12}>
												<Field.Label required>{t('Subject')}</Field.Label>
												<Field.Row>
													<TextInput
														{...register('subject', { required: true })}
														className='active'
														error={
															errors.subject &&
															t('error-the-field-is-required', {
																field: t('Subject'),
															})
														}
														flexGrow={1}
													/>
												</Field.Row>
												<Field.Error>{errors.subject?.message}</Field.Error>
											</Field>
										</>
									)}
								</>
							)}
							<Field marginBlockStart={16}>
								<Field.Label color='annotation' fontScale='c1'>
									{canSendTranscriptPDF && canSendTranscriptEmail
										? t('These_options_affect_this_conversation_only_To_set_default_selections_go_to_My_Account_Omnichannel')
										: t('This_option_affect_this_conversation_only_To_set_default_selection_go_to_My_Account_Omnichannel')}
								</Field.Label>
							</Field>
						</>
					)}
				</FieldGroup>
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
