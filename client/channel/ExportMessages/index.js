import React, { useState, useEffect, useMemo } from 'react';
import { Field, TextInput, Select, ButtonGroup, Button, Box, Icon, Callout } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import VerticalBar from '../../components/basic/VerticalBar';
import { useTranslation } from '../../contexts/TranslationContext';
import { useForm } from '../../hooks/useForm';
import { useEndpoint } from '../../contexts/ServerContext';

const FileExport = ({ onCancel, rid }) => {
	const t = useTranslation();

	const { values, handlers } = useForm({
		dateFrom: '',
		dateTo: '',
		format: '',
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

	const handleSubmit = () => {
		roomsExport({
			rid,
			type: 'file',
			dateFrom,
			dateTo,
			format,
		});
	};

	return (
		<>
			<Field>
				<Field.Label>{t('Date')}</Field.Label>
				<Field.Row>
					<TextInput type='date' value={dateFrom} onChange={handleDateFrom} />
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
		</>
	);
};

const clickable = css`
	cursor: pointer;
`;

const MailExportForm = ({ onCancel, rid }) => {
	const t = useTranslation();

	const [selectedMessages, setSelected] = useState([]);

	const { values, handlers } = useForm({
		dateFrom: '',
		dateTo: '',
		toUsers: '',
		additionalEmails: '',
		subject: t('Mail_Messages_Subject', selectedMessages.length), // TODO i18n replace
	});

	const {
		toUsers,
		additionalEmails,
		subject,
	} = values;

	const add = useMutableCallback((id) => setSelected(selectedMessages.concat(id)));
	const remove = useMutableCallback((id) => setSelected(selectedMessages.filter((message) => message !== id)));
	const reset = useMutableCallback(() => {
		setSelected([]);
		$(`#chat-window-${ rid }.messages-box .message.selected`)
			.removeClass('selected');
	});

	useEffect(() => {
		const $root = $(`#chat-window-${ rid }`);
		const handler = function() {
			const { id } = this;

			if (this.classList.contains('selected')) {
				this.classList.remove('selected');
				remove(id);
			} else {
				this.classList.add('selected');
				add(id);
			}
		};
		$('.messages-box .message', $root).on('click', handler);

		return () => {
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

	const handleSubmit = () => {
		roomsExport({
			rid,
			type: 'email',
			toUsers,
			additionalEmails,
			subject,
		});
	};

	return (
		<>
			<Callout onClick={reset} title={t('Messages selected')} type={selectedMessages.length > 0 ? 'success' : 'info'}>
				<p>{`${ selectedMessages.length } Messages selected`}</p>
				{ selectedMessages.length > 0 && <Box is='p' className={clickable} >{t('Click here to clear the selection')}</Box> }
				{ selectedMessages.length === 0 && <Box is='p'>{t('Click_the_messages_you_would_like_to_send_by_email')}</Box> }
			</Callout>
			<Field>
				<Field.Label>{t('To_users')}</Field.Label>
				<Field.Row>
					<TextInput placeholder={t('Username_Placeholder')} value={toUsers} onChange={handleToUsers} addon={<Icon name='at' size='x20'/>} />
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
			<ButtonGroup stretch mb='x12'>
				<Button onClick={onCancel}>
					{t('Cancel')}
				</Button>
				<Button primary onClick={() => handleSubmit()}>
					{t('Send')}
				</Button>
			</ButtonGroup>
		</>
	);
};


export const ExportMessages = function ExportMessages({ rid, tabBar }) {
	const t = useTranslation();

	const [type, setType] = useState('email');

	const exportOptions = useMemo(() => [
		['email', t('Send_via_Email')],
		['file', t('Export_as_File')],
	], [t]);

	return (
		<VerticalBar>
			<VerticalBar.Header>
				{t('Export_Messages')}
				<VerticalBar.Close onClick={() => tabBar.close()} />
			</VerticalBar.Header>
			<VerticalBar.Content>
				<Field>
					<Field.Label>{t('Export_type')}</Field.Label>
					<Field.Row>
						<Select value={type} onChange={(value) => setType(value)} placeholder={t('Type')} options={exportOptions}/>
					</Field.Row>
				</Field>
				{type && type === 'file' && <FileExport rid={rid} onCancel={() => tabBar.close()} />}
				{type && type === 'email' && <MailExportForm rid={rid} onCancel={() => tabBar.close()} />}
			</VerticalBar.Content>
		</VerticalBar>
	);
};

export default ExportMessages;
