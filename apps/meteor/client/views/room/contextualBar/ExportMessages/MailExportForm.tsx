import type { IRoom } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Field, TextInput, ButtonGroup, Button, Box, Icon, Callout, FieldGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useUserRoom, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, MouseEventHandler } from 'react';
import React, { useState, useEffect, useContext } from 'react';

import { validateEmail } from '../../../../../lib/emailValidator';
import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import { useForm } from '../../../../hooks/useForm';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { SelectedMessageContext, useCountSelected } from '../../MessageList/contexts/SelectedMessagesContext';

type MailExportFormValues = {
	dateFrom: string;
	dateTo: string;
	toUsers: string[];
	additionalEmails: string;
	subject: string;
};

type MailExportFormProps = { onCancel: MouseEventHandler<HTMLOrSVGElement>; rid: IRoom['_id'] };

const clickable = css`
	cursor: pointer;
`;

const MailExportForm: FC<MailExportFormProps> = ({ onCancel, rid }) => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);

	const t = useTranslation();
	const room = useUserRoom(rid);
	const roomName = room?.t && roomCoordinator.getRoomName(room.t, room);

	const [errorMessage, setErrorMessage] = useState<string>();

	const messages = selectedMessageStore.getSelectedMessages();
	const count = useCountSelected();

	const { values, handlers } = useForm({
		dateFrom: '',
		dateTo: '',
		toUsers: [],
		additionalEmails: '',
		subject: t('Mail_Messages_Subject', roomName),
	});

	const dispatchToastMessage = useToastMessageDispatch();

	const { toUsers, additionalEmails, subject } = values as MailExportFormValues;

	const clearSelection = useMutableCallback(() => {
		selectedMessageStore.clearStore();
	});

	useEffect(() => {
		selectedMessageStore.setIsSelecting(true);
		return (): void => {
			selectedMessageStore.reset();
		};
	}, [selectedMessageStore]);

	const { handleToUsers, handleAdditionalEmails, handleSubject } = handlers;

	const roomsExport = useEndpoint('POST', '/v1/rooms.export');

	const handleSubmit = async (): Promise<void> => {
		if (toUsers.length === 0 && additionalEmails === '') {
			setErrorMessage(t('Mail_Message_Missing_to'));
			return;
		}
		if (additionalEmails !== '' && !validateEmail(additionalEmails)) {
			setErrorMessage(t('Mail_Message_Invalid_emails', additionalEmails));
			return;
		}
		if (messages.length === 0) {
			setErrorMessage(t('Mail_Message_No_messages_selected_select_all'));
			return;
		}
		setErrorMessage(undefined);

		try {
			await roomsExport({
				rid,
				type: 'email',
				toUsers,
				toEmails: additionalEmails.split(','),
				subject,
				messages,
			});

			dispatchToastMessage({
				type: 'success',
				message: t('Your_email_has_been_queued_for_sending'),
			});
		} catch (error) {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		}
	};

	return (
		<FieldGroup>
			<Field>
				<Callout onClick={clearSelection} title={t('Messages_selected')} type={count > 0 ? 'success' : 'info'}>
					<p>{`${count} Messages selected`}</p>
					{count > 0 && (
						<Box is='p' className={clickable}>
							{t('Click_here_to_clear_the_selection')}
						</Box>
					)}
					{count === 0 && <Box is='p'>{t('Click_the_messages_you_would_like_to_send_by_email')}</Box>}
				</Callout>
			</Field>
			<Field>
				<Field.Label>{t('To_users')}</Field.Label>
				<Field.Row>
					<UserAutoCompleteMultiple value={toUsers} onChange={handleToUsers} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('To_additional_emails')}</Field.Label>
				<Field.Row>
					<TextInput
						placeholder={t('Email_Placeholder_any')}
						value={additionalEmails}
						onChange={handleAdditionalEmails}
						addon={<Icon name='mail' size='x20' />}
					/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Subject')}</Field.Label>
				<Field.Row>
					<TextInput value={subject} onChange={handleSubject} addon={<Icon name='edit' size='x20' />} />
				</Field.Row>
			</Field>

			{errorMessage && <Callout type='danger'>{errorMessage}</Callout>}

			<ButtonGroup stretch mb={12}>
				<Button onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary onClick={(): Promise<void> => handleSubmit()}>
					{t('Send')}
				</Button>
			</ButtonGroup>
		</FieldGroup>
	);
};

export default MailExportForm;
