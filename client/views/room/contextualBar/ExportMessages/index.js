import React, { useState, useEffect, useMemo } from 'react';
import { Field, TextInput, Select, ButtonGroup, Button, Box, Icon, Callout, FieldGroup } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import VerticalBar from '../../../../components/VerticalBar';
import { UserAutoComplete } from '../../../../components/AutoComplete';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useForm } from '../../../../hooks/useForm';
import { useUserRoom } from '../../hooks/useUserRoom';
import { useEndpoint } from '../../../../contexts/ServerContext';
import { roomTypes, isEmail } from '../../../../../app/utils/client';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTabBarClose } from '../../providers/ToolboxProvider';

const clickable = css`
	cursor: pointer;
`;

const FileExport = ({ onCancel, rid }) => {
	const t = useTranslation();

	const { values, handlers } = useForm({
		dateFrom: '',
		dateTo: '',
		format: 'html',
	});

	const {
		dateFrom,
		dateTo,
		format,
	} = values;

	const {
		handleDateFrom,
		handleDateTo,
		handleFormat,
	} = handlers;

	const outputOptions = useMemo(() => [
		['html', t('HTML')],
		['json', t('JSON')],
	], [t]);

	const roomsExport = useEndpoint('POST', 'rooms.export');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleSubmit = async () => {
		try {
			await roomsExport({
				rid,
				type: 'file',
				...dateFrom && { dateFrom: new Date(dateFrom) },
				...dateTo && { dateTo: new Date(dateTo) },
				format,
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
				<Field.Label>{t('Date_From')}</Field.Label>
				<Field.Row>
					<TextInput type='date' value={dateFrom} onChange={handleDateFrom} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Date_to')}</Field.Label>
				<Field.Row>
					<TextInput type='date' value={dateTo} onChange={handleDateTo} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Output_format')}</Field.Label>
				<Field.Row>
					<Select value={format} onChange={handleFormat} placeholder={t('Format')} options={outputOptions}/>
				</Field.Row>
			</Field>
			<ButtonGroup stretch mb='x12'>
				<Button onClick={onCancel}>
					{t('Cancel')}
				</Button>
				<Button primary onClick={() => handleSubmit()}>
					{t('Export')}
				</Button>
			</ButtonGroup>
		</FieldGroup>
	);
};

const MailExportForm = ({ onCancel, rid }) => {
	const t = useTranslation();

	const room = useUserRoom(rid);
	const roomName = room && room.t && roomTypes.getRoomName(room.t, room);

	const [selectedMessages, setSelected] = useState([]);

	const [errorMessage, setErrorMessage] = useState();

	const { values, handlers } = useForm({
		dateFrom: '',
		dateTo: '',
		toUsers: '',
		additionalEmails: '',
		subject: t('Mail_Messages_Subject', roomName),
	});

	const dispatchToastMessage = useToastMessageDispatch();

	const {
		toUsers,
		additionalEmails,
		subject,
	} = values;

	const reset = useMutableCallback(() => {
		setSelected([]);
		$('.messages-box .message', $(`#chat-window-${ rid }`))
			.removeClass('selected');
	});

	useEffect(() => {
		const $root = $(`#chat-window-${ rid }`);
		$('.messages-box', $root).addClass('selectable');

		const handler = function() {
			const { id } = this;

			if (this.classList.contains('selected')) {
				this.classList.remove('selected');
				setSelected((selectedMessages) => selectedMessages.filter((message) => message !== id));
			} else {
				this.classList.add('selected');
				setSelected((selectedMessages) => selectedMessages.concat(id));
			}
		};
		$('.messages-box .message', $root).on('click', handler);

		return () => {
			$('.messages-box', $root).removeClass('selectable');
			$('.messages-box .message', $root)
				.off('click', handler)
				.filter('.selected')
				.removeClass('selected');
		};
	}, [rid]);

	const {
		handleToUsers,
		handleAdditionalEmails,
		handleSubject,
	} = handlers;

	const roomsExport = useEndpoint('POST', 'rooms.export');

	const handleSubmit = async () => {
		if (toUsers.length === 0 && additionalEmails === '') {
			setErrorMessage(t('Mail_Message_Missing_to'));
			return;
		}
		if (additionalEmails !== '' && !isEmail(additionalEmails)) {
			setErrorMessage(t('Mail_Message_Invalid_emails', additionalEmails));
			return;
		}
		if (selectedMessages.length === 0) {
			setErrorMessage(t('Mail_Message_No_messages_selected_select_all'));
			return;
		}
		setErrorMessage(null);

		try {
			await roomsExport({
				rid,
				type: 'email',
				toUsers: [toUsers],
				toEmails: additionalEmails.split(','),
				subject,
				messages: selectedMessages,
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
				<Callout onClick={reset} title={t('Messages selected')} type={selectedMessages.length > 0 ? 'success' : 'info'}>
					<p>{`${ selectedMessages.length } Messages selected`}</p>
					{ selectedMessages.length > 0 && <Box is='p' className={clickable} >{t('Click here to clear the selection')}</Box> }
					{ selectedMessages.length === 0 && <Box is='p'>{t('Click_the_messages_you_would_like_to_send_by_email')}</Box> }
				</Callout>
			</Field>
			<Field>
				<Field.Label>{t('To_users')}</Field.Label>
				<Field.Row>
					<UserAutoComplete value={toUsers} onChange={handleToUsers}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('To_additional_emails')}</Field.Label>
				<Field.Row>
					<TextInput placeholder={t('Email_Placeholder_any')} value={additionalEmails} onChange={handleAdditionalEmails} addon={<Icon name='mail' size='x20'/>} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Subject')}</Field.Label>
				<Field.Row>
					<TextInput value={subject} onChange={handleSubject} addon={<Icon name='edit' size='x20'/>} />
				</Field.Row>
			</Field>

			{errorMessage && <Callout type={'danger'} title={errorMessage} />}

			<ButtonGroup stretch mb='x12'>
				<Button onClick={onCancel}>
					{t('Cancel')}
				</Button>
				<Button primary onClick={() => handleSubmit()}>
					{t('Send')}
				</Button>
			</ButtonGroup>
		</FieldGroup>
	);
};

export const ExportMessages = function ExportMessages({ rid }) {
	const t = useTranslation();
	const close = useTabBarClose();

	const [type, setType] = useState('email');

	const exportOptions = useMemo(() => [
		['email', t('Send_via_email')],
		['file', t('Export_as_file')],
	], [t]);

	return (<>
		<VerticalBar.Header>
			{t('Export_Messages')}
			<VerticalBar.Close onClick={close} />
		</VerticalBar.Header>
		<VerticalBar.ScrollableContent>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Method')}</Field.Label>
					<Field.Row>
						<Select value={type} onChange={(value) => setType(value)} placeholder={t('Type')} options={exportOptions}/>
					</Field.Row>
				</Field>
			</FieldGroup>
			{type && type === 'file' && <FileExport rid={rid} onCancel={close} />}
			{type && type === 'email' && <MailExportForm rid={rid} onCancel={close} />}
		</VerticalBar.ScrollableContent>
	</>
	);
};

export default ExportMessages;
