import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Field, Button, TextInput, Modal, Box, FieldGroup, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type TranscriptModalProps = {
	email: string;
	room: IOmnichannelRoom;
	onRequest: (email: string, subject: string) => void;
	onSend?: (email: string, subject: string, token: string) => void;
	onCancel: () => void;
	onDiscard: () => void;
};

const TranscriptModal = ({ email: emailDefault = '', room, onRequest, onSend, onCancel, onDiscard, ...props }: TranscriptModalProps) => {
	const { t } = useTranslation();

	const {
		register,
		handleSubmit,
		setValue,
		setFocus,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: { email: emailDefault || '', subject: t('Transcript_of_your_livechat_conversation') },
	});

	useEffect(() => {
		setFocus('subject');
	}, [setFocus]);

	const { transcriptRequest } = room;
	const roomOpen = room?.open;
	const token = room?.v?.token;

	const handleDiscard = useCallback(() => onDiscard(), [onDiscard]);

	const submit = useCallback(
		({ email, subject }: { email: string; subject: string }) => {
			if (roomOpen && !transcriptRequest) {
				onRequest(email, subject);
			}
			if (!roomOpen && onSend && token) {
				onSend(email, subject, token);
			}
		},
		[onRequest, onSend, roomOpen, token, transcriptRequest],
	);

	useEffect(() => {
		if (transcriptRequest) {
			setValue('email', transcriptRequest.email);
			setValue('subject', transcriptRequest.subject);
		}
	}, [setValue, transcriptRequest]);

	// const canSubmit = isValid && Boolean(watch('subject'));

	return (
		<Modal open wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(submit)} {...props} />} {...props}>
			<Modal.Header>
				<Modal.Icon name='mail-arrow-top-right' />
				<Modal.Title>{t('Transcript')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				{!!transcriptRequest && <p>{t('Livechat_transcript_already_requested_warning')}</p>}
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Email')}*</FieldLabel>
						<FieldRow>
							<TextInput
								disabled={!!emailDefault || !!transcriptRequest}
								error={errors.email?.message}
								flexGrow={1}
								{...register('email', { required: t('Required_field', { field: t('Email') }) })}
							/>
						</FieldRow>
						<FieldError>{errors.email?.message}</FieldError>
					</Field>
					<Field>
						<FieldLabel>{t('Subject')}*</FieldLabel>
						<FieldRow>
							<TextInput
								disabled={!!transcriptRequest}
								error={errors.subject?.message}
								flexGrow={1}
								{...register('subject', { required: t('Required_field', { field: t('Subject') }) })}
							/>
						</FieldRow>
						<FieldError>{errors.subject?.message}</FieldError>
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					{roomOpen && transcriptRequest && (
						<Button danger onClick={handleDiscard}>
							{t('Undo_request')}
						</Button>
					)}
					{roomOpen && !transcriptRequest && (
						<Button aria-label='request-button' disabled={isSubmitting} loading={isSubmitting} primary type='submit'>
							{t('Request')}
						</Button>
					)}
					{!roomOpen && (
						<Button aria-label='send-button' disabled={isSubmitting} loading={isSubmitting} primary type='submit'>
							{t('Send')}
						</Button>
					)}
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default TranscriptModal;
