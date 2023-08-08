import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Field, Button, TextInput, Modal, Box, FieldGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';

type TranscriptModalProps = {
	email: string;
	room: IOmnichannelRoom;
	onRequest: (email: string, subject: string) => void;
	onSend?: (email: string, subject: string, token: string) => void;
	onCancel: () => void;
	onDiscard: () => void;
};

const TranscriptModal: FC<TranscriptModalProps> = ({
	email: emailDefault = '',
	room,
	onRequest,
	onSend,
	onCancel,
	onDiscard,
	...props
}) => {
	const t = useTranslation();

	const {
		register,
		handleSubmit,
		setValue,
		setFocus,
		watch,
		formState: { errors, isValid },
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

	const canSubmit = isValid && Boolean(watch('subject'));

	return (
		<Modal wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(submit)} {...props} />} {...props}>
			<Modal.Header>
				<Modal.Icon name='mail-arrow-top-right' />
				<Modal.Title>{t('Transcript')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				{!!transcriptRequest && <p>{t('Livechat_transcript_already_requested_warning')}</p>}
				<FieldGroup>
					<Field>
						<Field.Label>{t('Email')}*</Field.Label>
						<Field.Row>
							<TextInput
								disabled={!!emailDefault || !!transcriptRequest}
								error={errors.email?.message}
								flexGrow={1}
								{...register('email', { required: t('The_field_is_required', t('Email')) })}
							/>
						</Field.Row>
						<Field.Error>{errors.email?.message}</Field.Error>
					</Field>
					<Field>
						<Field.Label>{t('Subject')}*</Field.Label>
						<Field.Row>
							<TextInput
								disabled={!!transcriptRequest}
								error={errors.subject?.message}
								flexGrow={1}
								{...register('subject', { required: t('The_field_is_required', t('Subject')) })}
							/>
						</Field.Row>
						<Field.Error>{errors.subject?.message}</Field.Error>
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
						<Button aria-label='request-button' disabled={!canSubmit} primary type='submit'>
							{t('Request')}
						</Button>
					)}
					{!roomOpen && (
						<Button aria-label='send-button' disabled={!canSubmit} primary type='submit'>
							{t('Send')}
						</Button>
					)}
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default TranscriptModal;
