import type { ILivechatDepartment, Serialized } from '@rocket.chat/core-typings';
import {
	Field,
	FieldGroup,
	Button,
	TextInput,
	Modal,
	Box,
	CheckBox,
	Divider,
	EmailInput,
	FieldLabel,
	FieldRow,
	FieldError,
} from '@rocket.chat/fuselage';
import { usePermission, useSetting, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { dispatchToastMessage } from '../../../lib/toast';
import GenericModal from '../../GenericModal';
import Tags from '../Tags';

type CloseChatModalFormData = {
	comment: string;
	tags: string[];
	transcriptPDF: boolean;
	transcriptEmail: boolean;
	subject: string;
};

type CloseChatModalProps = {
	department?: Serialized<ILivechatDepartment | null>;
	visitorEmail?: string;
	onCancel: () => void;
	onConfirm: (
		comment?: string,
		tags?: string[],
		preferences?: { omnichannelTranscriptPDF: boolean; omnichannelTranscriptEmail: boolean },
		requestData?: { email: string; subject: string },
	) => Promise<void>;
};

const CloseChatModal = ({ department, visitorEmail, onCancel, onConfirm }: CloseChatModalProps) => {
	const t = useTranslation();

	const {
		formState: { errors },
		handleSubmit,
		register,
		setError,
		setFocus,
		setValue,
		watch,
	} = useForm<CloseChatModalFormData>();

	const commentRequired = useSetting('Livechat_request_comment_when_closing_conversation', true);
	const alwaysSendTranscript = useSetting('Livechat_transcript_send_always', false);
	const customSubject = useSetting('Livechat_transcript_email_subject', '');
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

	const canSendTranscriptEmail = transcriptEmailPermission && visitorEmail && !alwaysSendTranscript;
	const canSendTranscriptPDF = transcriptPDFPermission && hasLicense;
	const canSendTranscript = canSendTranscriptEmail || canSendTranscriptPDF;

	const handleTags = (value: string[]): void => {
		setValue('tags', value);
	};

	const onSubmit = useCallback(
		({ comment, tags, transcriptPDF, transcriptEmail, subject }: CloseChatModalFormData) => {
			const preferences = {
				omnichannelTranscriptPDF: !!transcriptPDF,
				omnichannelTranscriptEmail: alwaysSendTranscript ? true : !!transcriptEmail,
			};
			const requestData = transcriptEmail && visitorEmail ? { email: visitorEmail, subject } : undefined;

			if (!comment?.trim() && commentRequired) {
				setError('comment', { type: 'custom', message: t('Required_field', { field: t('Comment') }) });
			}

			if (transcriptEmail && !subject) {
				setError('subject', { type: 'custom', message: t('Required_field', { field: t('Subject') }) });
			}

			if (!tags?.length && tagRequired) {
				setError('tags', { type: 'custom', message: t('error-tags-must-be-assigned-before-closing-chat') });
			}

			if (!errors.comment || errors.tags) {
				onConfirm(comment, tags, preferences, requestData);
			}
		},
		[commentRequired, tagRequired, visitorEmail, errors, setError, t, onConfirm, alwaysSendTranscript],
	);

	const cannotSubmit = useMemo(() => {
		const cannotSendTag = (tagRequired && !tags?.length) || errors.tags;
		const cannotSendComment = (commentRequired && !comment?.trim()) || errors.comment;
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
			setValue('subject', subject || customSubject || t('Transcript_of_your_livechat_conversation'));
		}
	}, [transcriptEmail, setValue, visitorEmail, subject, t, customSubject]);

	if (commentRequired || tagRequired || canSendTranscript) {
		return (
			<Modal wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(onSubmit)} {...props} data-qa-id='close-chat-modal' />}>
				<Modal.Header>
					<Modal.Icon name='baloon-close-top-right' />
					<Modal.Title>{t('Wrap_up_conversation')}</Modal.Title>
					<Modal.Close onClick={onCancel} />
				</Modal.Header>
				<Modal.Content fontScale='p2'>
					<Box color='annotation'>{t('Close_room_description')}</Box>
					<FieldGroup>
						<Field>
							<FieldLabel required={commentRequired}>{t('Comment')}</FieldLabel>
							<FieldRow>
								<TextInput
									{...register('comment')}
									error={errors.comment && t('Required_field', { field: t('Comment') })}
									flexGrow={1}
									placeholder={t('Please_add_a_comment')}
								/>
							</FieldRow>
							<FieldError>{errors.comment?.message}</FieldError>
						</Field>
						<Field>
							<Tags tagRequired={tagRequired} tags={tags} handler={handleTags} {...(department && { department: department._id })} />
							<FieldError>{errors.tags?.message}</FieldError>
						</Field>
						{canSendTranscript && (
							<>
								<Field>
									<Divider />
									<FieldLabel marginBlockStart={8}>{t('Chat_transcript')}</FieldLabel>
								</Field>
								{canSendTranscriptPDF && (
									<Field marginBlockStart={10}>
										<FieldRow>
											<FieldLabel htmlFor='transcript-pdf'>{t('Omnichannel_transcript_pdf')}</FieldLabel>
											<CheckBox id='transcript-pdf' {...register('transcriptPDF', { value: userTranscriptPDF })} />
										</FieldRow>
									</Field>
								)}
								{canSendTranscriptEmail && (
									<>
										<Field marginBlockStart={10}>
											<FieldRow>
												<FieldLabel htmlFor='transcript-email'>{t('Omnichannel_transcript_email')}</FieldLabel>
												<CheckBox id='transcript-email' {...register('transcriptEmail', { value: userTranscriptEmail })} />
											</FieldRow>
										</Field>
										{transcriptEmail && (
											<>
												<Field marginBlockStart={14}>
													<FieldLabel required>{t('Contact_email')}</FieldLabel>
													<FieldRow>
														<EmailInput value={visitorEmail} required disabled flexGrow={1} />
													</FieldRow>
												</Field>
												<Field marginBlockStart={12}>
													<FieldLabel required>{t('Subject')}</FieldLabel>
													<FieldRow>
														<TextInput
															{...register('subject', { required: true })}
															className='active'
															error={errors.subject && t('Required_field', { field: t('Subject') })}
															flexGrow={1}
														/>
													</FieldRow>
													<FieldError>{errors.subject?.message}</FieldError>
												</Field>
											</>
										)}
									</>
								)}
								<Field marginBlockStart={16}>
									<FieldLabel color='annotation' fontScale='c1'>
										{canSendTranscriptPDF && canSendTranscriptEmail
											? t('These_options_affect_this_conversation_only_To_set_default_selections_go_to_My_Account_Omnichannel')
											: t('This_option_affect_this_conversation_only_To_set_default_selection_go_to_My_Account_Omnichannel')}
									</FieldLabel>
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
		);
	}

	return (
		<GenericModal
			variant='warning'
			title={t('Are_you_sure_you_want_to_close_this_chat')}
			onConfirm={(): Promise<void> => onConfirm()}
			onCancel={onCancel}
			onClose={onCancel}
			confirmText={t('Confirm')}
		/>
	);
};

export default CloseChatModal;
