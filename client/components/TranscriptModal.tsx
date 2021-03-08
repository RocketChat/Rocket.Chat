import React, { FC, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Field, Button, TextInput, Icon, ButtonGroup, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../contexts/TranslationContext';
import { useForm } from '../hooks/useForm';
import { useComponentDidUpdate } from '../hooks/useComponentDidUpdate';
import { IRoom } from '../../definition/IRoom';


type TranscriptModalProps = {
	email: string;
	room?: IRoom;
	onSend: (email: string, subject: string) => void;
	onCancel: () => void;
	onDiscard: () => void;
};

const TranscriptModal: FC<TranscriptModalProps> = ({ email: emailDefault = '', room, onSend, onCancel, onDiscard, ...props }) => {
	const t = useTranslation();

	const ref = useRef<HTMLInputElement>();

	useEffect(() => {
		if (typeof ref?.current?.focus === 'function') {
			ref.current.focus();
		}
	}, [ref]);

	const { values, handlers } = useForm({ email: emailDefault, subject: t('Transcript_of_your_livechat_conversation') });

	const { email, subject } = values as { email: string; subject: string };
	const { handleEmail, handleSubject } = handlers;
	const [emailError, setEmailError] = useState('');
	const [subjectError, setSubjectError] = useState('');
	const { transcriptRequest } = room as IRoom;


	const handleSend = useCallback(() => {
		onSend(email, subject);
	}, [email, onSend, subject]);

	const handleDiscard = useCallback(() => onDiscard(), [onDiscard]);

	useComponentDidUpdate(() => {
		setEmailError(!email ? t('The_field_is_required', t('Email')) : '');
	}, [t, email]);

	useComponentDidUpdate(() => {
		setSubjectError(!subject ? t('The_field_is_required', t('Subject')) : '');
	}, [t, subject]);

	const canSave = useMemo(() => !!subject, [subject]);

	return <Modal {...props}>
		<Modal.Header>
			<Icon name='mail-arrow-top-right' size={20}/>
			<Modal.Title>{t('Transcript')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<Field marginBlock='x15'>
				<Field.Label>{t('Email')}*</Field.Label>
				<Field.Row>
					<TextInput disabled={!!emailDefault || !!transcriptRequest} ref={ref} error={emailError} flexGrow={1} value={email} onChange={handleEmail} />
				</Field.Row>
				<Field.Error>
					{emailError}
				</Field.Error>
			</Field>
			<Field marginBlock='x15'>
				<Field.Label>{t('Subject')}*</Field.Label>
				<Field.Row>
					<TextInput disabled={!!transcriptRequest} error={subjectError} flexGrow={1} value={subject} onChange={handleSubject} />
				</Field.Row>
				<Field.Error>
					{subjectError}
				</Field.Error>
			</Field>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onCancel}>{t('Cancel')}</Button>
				{ transcriptRequest
					? <Button primary danger onClick={handleDiscard}>{t('Discard')}</Button>
					: <Button disabled={!canSave} primary onClick={handleSend}>{t('Send')}</Button>
				}
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default TranscriptModal;
