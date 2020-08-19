import React, { useState } from 'react';
import { Field, TextInput, Select, ButtonGroup, Button, Box, Icon } from '@rocket.chat/fuselage';

import VerticalBar from '../../components/basic/VerticalBar';
import { useTranslation } from '../../contexts/TranslationContext';
import { useForm } from '../../hooks/useForm';

const FileExport = () => {
	const t = useTranslation();

	const { values, handlers } = useForm({
		dateFrom: '',
		dateTo: '',
		output: '',
	});

	const {
		dateFrom,
		dateTo,
		output,
	} = values;

	const {
		handleDateFrom,
		handleDateTo,
		handleOutput,
	} = handlers;

	const outputOptions = [
		['html', t('HTML')],
		['json', t('JSON')],
	];

	return (
		<>
			<Field>
				<Field.Label>{t('Date')}</Field.Label>
				<Field.Row>
					<TextInput type='date' value={dateFrom} onChange={(e) => handleDateFrom(e.currentTarget.value)} />
					<TextInput type='date' value={dateTo} onChange={(e) => handleDateTo(e.currentTarget.value)} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Output_format')}</Field.Label>
				<Field.Row>
					<Select value={output} onChange={(value) => handleOutput(value)} placeholder={t('Format')} options={outputOptions}/>
				</Field.Row>
			</Field>
		</>
	);
};

const MailExport = ({ onClearSelection = () => {} }) => {
	const t = useTranslation();

	const [selected, setSelected] = useState(10);

	const { values, handlers } = useForm({
		dateFrom: '',
		dateTo: '',
		toUsers: '',
		additionalEmails: '',
		subject: t('Mail_Messages_Subject', selected), // TODO i18n replace
	});

	const {
		toUsers,
		additionalEmails,
		subject,
	} = values;

	const {
		handleToUsers,
		handleAdditionalEmails,
		handleSubject,
	} = handlers;

	return (
		<>
			<Box className={`mail-messages__instructions ${ selected > 0 ? 'mail-messages__instructions--selected' : '' }`}>
				<Box className='mail-messages__instructions-wrapper'>
					{selected > 0
						? <>
							<Icon name='checkmark-circled' size='x20'/>
							<Box className='mail-messages__instructions-text' onClick={() => { setSelected(0); onClearSelection(); }}>
								{t('Messages selected')}
								<Box className='mail-messages__instructions-text-selected'>{`${ selected } Messages selected`}</Box>
								<Box>{t('Click here to clear the selection')}</Box>
							</Box>
						</>
						: <>
							<Icon name='hand-pointer' size='x20'/>
							<Box className='mail-messages__instructions-text'>
								{t('Click_the_messages_you_would_like_to_send_by_email')}
							</Box>
						</>
					}
				</Box>
			</Box>
			<Field>
				<Field.Label>{t('To_users')}</Field.Label>
				<Field.Row>
					<TextInput placeholder={t('Username_Placeholder')} value={toUsers} onChange={(e) => handleToUsers(e.currentTarget.value)} addon={<Icon name='at' size='x20'/>} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('To_additional_emails')}</Field.Label>
				<Field.Row>
					<TextInput placeholder={t('Email_Placeholder_any')} value={additionalEmails} onChange={(e) => handleAdditionalEmails(e.currentTarget.value)} addon={<Icon name='mail' size='x20'/>} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Subject')}</Field.Label>
				<Field.Row>
					<TextInput value={subject} onChange={(e) => handleSubject(e.currentTarget.value)} addon={<Icon name='edit' size='x20'/>} />
				</Field.Row>
			</Field>
		</>
	);
};

export const ExportMessages = function ExportMessages({ onClearSelection }) {
	const t = useTranslation();

	const [type, setType] = useState('email');

	const exportOptions = [
		['email', t('Send_via_Email')],
		['file', t('Export_as_File')],
	];

	return (
		<VerticalBar>
			<VerticalBar.Header>
				{t('Export_Messages')}
				<VerticalBar.Close />
			</VerticalBar.Header>
			<VerticalBar.Content>
				<Field>
					<Field.Label>{t('Export_type')}</Field.Label>
					<Field.Row>
						<Select value={type} onChange={(value) => setType(value)} placeholder={t('Type')} options={exportOptions}/>
					</Field.Row>
				</Field>
				{type && type === 'file' && <FileExport />}
				{type && type === 'email' && <MailExport onClearSelection={onClearSelection} />}
				<ButtonGroup stretch mb='x12'>
					<Button onClick={() => {}}>
						{t('Cancel')}
					</Button>
					<Button primary onClick={() => {}}>
						{t('Export')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Content>
		</VerticalBar>
	);
};

export default ExportMessages;
