import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import {
	Button,
	Modal,
	Box,
	ModalHeader,
	ModalIcon,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel, FieldRow, FieldError, TextInput } from '@rocket.chat/fuselage-forms';
import { useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
		control,
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

	return (
		<Modal open wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(submit)} {...props} />} {...props}>
			<ModalHeader>
				<ModalIcon name='mail-arrow-top-right' />
				<ModalTitle>{t('Transcript')}</ModalTitle>
				<ModalClose onClick={onCancel} />
			</ModalHeader>
			<ModalContent fontScale='p2'>
				{!!transcriptRequest && <p>{t('Livechat_transcript_already_requested_warning')}</p>}
				<FieldGroup>
					<Field>
						<FieldLabel required>{t('Email')}</FieldLabel>
						<FieldRow>
							<Controller
								name='email'
								control={control}
								rules={{ required: t('Required_field', { field: t('Email') }) }}
								render={({ field }) => (
									<TextInput
										{...field}
										disabled={!!emailDefault || !!transcriptRequest}
										error={errors.email?.message}
										flexGrow={1}
										aria-required='true'
									/>
								)}
							/>
						</FieldRow>
						{errors.email && <FieldError>{errors.email?.message}</FieldError>}
					</Field>
					<Field>
						<FieldLabel required>{t('Subject')}</FieldLabel>
						<FieldRow>
							<Controller
								name='subject'
								control={control}
								rules={{ required: t('Required_field', { field: t('Subject') }) }}
								render={({ field }) => (
									<TextInput {...field} disabled={!!transcriptRequest} error={errors.subject?.message} flexGrow={1} aria-required='true' />
								)}
							/>
						</FieldRow>
						{errors.subject && <FieldError>{errors.subject?.message}</FieldError>}
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					{roomOpen && transcriptRequest && (
						<Button danger onClick={handleDiscard}>
							{t('Undo_request')}
						</Button>
					)}
					{roomOpen && !transcriptRequest && (
						<Button disabled={isSubmitting} loading={isSubmitting} primary type='submit'>
							{t('Request')}
						</Button>
					)}
					{!roomOpen && (
						<Button disabled={isSubmitting} loading={isSubmitting} primary type='submit'>
							{t('Send')}
						</Button>
					)}
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default TranscriptModal;
