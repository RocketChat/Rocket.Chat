import React, { useMemo, useState } from 'react';
import { Field, TextInput, Select, ButtonGroup, Button, PasswordInput, MultiSelectFiltered, Box, ToggleSwitch, Icon, Divider } from '@rocket.chat/fuselage';

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

const MailExport = () => {
	const t = useTranslation();

	const { values, handlers } = useForm({
		dateFrom: '',
		dateTo: '',
		toUsers: '',
		additionalEmails: '',
		subject: '',
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
			<Field>
				<Field.Label>{t('To_users')}</Field.Label>
				<Field.Row>
					<TextInput value={toUsers} onChange={(e) => handleToUsers(e.currentTarget.value)} addon={<Icon name='at' size='x20'/>} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('To_additional_emails')}</Field.Label>
				<Field.Row>
					<TextInput value={additionalEmails} onChange={(e) => handleAdditionalEmails(e.currentTarget.value)} addon={<Icon name='mail' size='x20'/>} />
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

export const ExportMessages = function ExportMessages({ uid, username, tabBar, rid, onClose, video, showBackButton, ...props }) {
	const t = useTranslation();

	const [type, setType] = useState('');

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
				{type && type === 'email' && <MailExport />}
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
