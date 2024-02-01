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
	FieldHint,
} from '@rocket.chat/fuselage';
import { usePermission, useSetting, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import { dispatchToastMessage } from '../../../lib/toast';
import GenericModal from '../../GenericModal';
import Tags from '../Tags';

type CloseChatPayload = {
	comment?: string;
	tags?: string[];
	preferences?: { omnichannelTranscriptPDF: boolean; omnichannelTranscriptEmail: boolean };
	requestData?: { email: string; subject: string };
	subject?: string;
	transcriptEmail?: boolean;
	transcriptPDF?: boolean;
	visitorEmail?: string;
};

const CloseChatModal = ({
	department,
	visitorEmail,
	onCancel,
	onConfirm,
}: {
	department?: Serialized<ILivechatDepartment | null>;
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
		setFocus,
		setValue,
		watch,
		control,
	} = useForm<CloseChatPayload>();

	const [tags, transcriptEmail, subject] = watch(['tags', 'transcriptEmail', 'subject']);
	const isCommentRequired = useSetting<boolean>('Livechat_request_comment_when_closing_conversation');
	const [isTagRequired, setTagRequired] = useState(false);

	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const userTranscriptEmail = useUserPreference<boolean>('omnichannelTranscriptEmail') ?? false;
	const userTranscriptPDF = useUserPreference<boolean>('omnichannelTranscriptPDF') ?? false;
	const transcriptPDFPermission = usePermission('request-pdf-transcript');
	const transcriptEmailPermission = usePermission('send-omnichannel-chat-transcript');

	const canSendTranscriptEmail = transcriptEmailPermission && !!visitorEmail;
	const canSendTranscriptPDF = transcriptPDFPermission && hasLicense;
	const canSendTranscript = canSendTranscriptEmail || canSendTranscriptPDF;

	const onSubmit = useCallback(
		({ comment, tags, transcriptPDF, transcriptEmail, subject }): void => {
			const requestData = transcriptEmail && visitorEmail ? { email: visitorEmail, subject } : undefined;
			const preferences = {
				omnichannelTranscriptPDF: !!transcriptPDF,
				omnichannelTranscriptEmail: !!transcriptEmail,
			};

			onConfirm(comment, tags, preferences, requestData);
		},
		[onConfirm, visitorEmail],
	);

	useEffect(() => {
		if (department?.requestTagBeforeClosingChat) {
			setTagRequired(true);
		}
	}, [department]);

	useEffect(() => {
		if (isCommentRequired) {
			setFocus('comment');
		}
	}, [isCommentRequired, setFocus]);

	useEffect(() => {
		if (transcriptEmail && !visitorEmail) {
			dispatchToastMessage({ type: 'error', message: t('Customer_without_registered_email') });
		}
	}, [transcriptEmail, setValue, visitorEmail, subject, t]);

	if (isCommentRequired || isTagRequired || canSendTranscript) {
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
							<FieldLabel required={isCommentRequired}>{t('Comment')}</FieldLabel>
							<FieldRow>
								<TextInput
									{...register('comment', {
										validate: (v) => !isCommentRequired || !!v?.trim() || t('The_field_is_required', t('Comment')),
									})}
									error={errors.comment?.message}
									flexGrow={1}
									placeholder={t('Please_add_a_comment')}
								/>
							</FieldRow>
							<FieldError>{errors.comment?.message}</FieldError>
						</Field>

						<Controller
							name='tags'
							control={control}
							rules={{ validate: () => !isTagRequired || !!tags?.length || t('error-tags-must-be-assigned-before-closing-chat') }}
							render={({ field: { onChange, value } }) => (
								<Tags
									tags={value}
									handler={onChange}
									required={isTagRequired}
									error={errors.tags?.message}
									{...(department && { department: department._id })}
								/>
							)}
						/>

						{canSendTranscript && (
							<>
								<Field>
									<Divider />
									<FieldLabel mbs={8}>{t('Chat_transcript')}</FieldLabel>
								</Field>

								{canSendTranscriptPDF && (
									<Field mbs={10}>
										<FieldRow>
											<FieldLabel htmlFor='transcript-pdf'>{t('Omnichannel_transcript_pdf')}</FieldLabel>
											<CheckBox id='transcript-pdf' {...register('transcriptPDF', { value: userTranscriptPDF })} />
										</FieldRow>
									</Field>
								)}

								{canSendTranscriptEmail && (
									<>
										<Field mbs={10}>
											<FieldRow>
												<FieldLabel htmlFor='transcript-email'>{t('Omnichannel_transcript_email')}</FieldLabel>
												<CheckBox id='transcript-email' {...register('transcriptEmail', { value: userTranscriptEmail })} />
											</FieldRow>
										</Field>

										{transcriptEmail && (
											<>
												<Field mbs={14}>
													<FieldLabel required>{t('Contact_email')}</FieldLabel>
													<FieldRow>
														<EmailInput value={visitorEmail} required disabled flexGrow={1} />
													</FieldRow>
												</Field>
												<Field mbs={12}>
													<FieldLabel required>{t('Subject')}</FieldLabel>
													<FieldRow>
														<TextInput
															{...register('subject', {
																value: t('Transcript_of_your_livechat_conversation'),
																required: t('The_field_is_required', t('Subject')),
															})}
															error={errors.subject?.message}
															flexGrow={1}
														/>
													</FieldRow>
													<FieldError>{errors.subject?.message}</FieldError>
												</Field>
											</>
										)}
									</>
								)}

								<Field mbs={16}>
									<FieldHint fontScale='c1'>
										{canSendTranscriptPDF && canSendTranscriptEmail
											? t('These_options_affect_this_conversation_only_To_set_default_selections_go_to_My_Account_Omnichannel')
											: t('This_option_affect_this_conversation_only_To_set_default_selection_go_to_My_Account_Omnichannel')}
									</FieldHint>
								</Field>
							</>
						)}
					</FieldGroup>
				</Modal.Content>
				<Modal.Footer>
					<Modal.FooterControllers>
						<Button onClick={onCancel}>{t('Cancel')}</Button>
						<Button type='submit' disabled={transcriptEmail && !visitorEmail} primary>
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
