import React, { useState, useCallback } from 'react';
import { TextInput, TextAreaInput, Field, FieldGroup, CheckBox, Button, Icon } from '@rocket.chat/fuselage';
import toastr from 'toastr';


import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { Page } from '../../../../../client/components/basic/Page';


const isValidEmail = (value) => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);

const isValidQuery = (value) => {
	try {
		if (!value) { return true; }
		JSON.parse(value);
		return true;
	} catch {
		return false;
	}
};

const sendMailAction = () => {
	const meteorSendMail = useMethod('Mailer.sendMail');
	const t = useTranslation();
	return ({ fromEmail, subject, emailBody, dryRun, query }) => {
		if (query.error) {
			toastr.error(t('Query_is_not_valid_JSON'));
			return;
		}
		if (fromEmail.error || fromEmail.length < 1) {
			toastr.error(t('error-invalid-from-address'));
			return;
		}
		if (emailBody.indexOf('[unsubscribe]') === -1) {
			toastr.error(t('error-missing-unsubscribe-link'));
			return;
		}
		meteorSendMail(fromEmail.value, subject, emailBody, dryRun, query.value);
	};
};

export default function Mailer() {
	const t = useTranslation();

	const sendMail = sendMailAction();

	const [fromEmail, setFromEmail] = useState({ value: '', error: false });
	const [dryRun, setDryRun] = useState(false);
	const [query, setQuery] = useState({ value: '', error: false });
	const [subject, setSubject] = useState('');
	const [emailBody, setEmailBody] = useState('');

	return <Page _id='mailer'>
		<Page.Header title={t('Mailer')}></Page.Header>
		<Page.ContentShadowScroll maxWidth='x600' alignSelf='center' display='flex' flexDirection='column'>
			<FieldGroup is='form' method='post'>
				<Field>
					<Field.Label>{t('From')}</Field.Label>
					<Field.Row>
						<TextInput
							id='fromEmail'
							placeholder={t('Type_your_email')}
							value={fromEmail.value}
							error={fromEmail.error}
							onChange={(e) => {
								setFromEmail({
									value: e.currentTarget.value,
									error: !isValidEmail(e.currentTarget.value),
								});
							}}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox
							id='dryRun'
							checked={dryRun}
							onChange={() => setDryRun(!dryRun)}
						/>
						<Field.Label htmlFor='dry-run'>
							{t('Dry_run')}
						</Field.Label>
					</Field.Row>
					<Field.Hint>{t('Dry_run_description')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('Query')}</Field.Label>
					<Field.Row>
						<TextInput id='query'
							value={query.value}
							error={query.error}
							onChange={(e) => {
								setQuery({
									value: e.currentTarget.value,
									error: !isValidQuery(e.currentTarget.value),
								});
							}}
						/>
					</Field.Row>
					<Field.Hint>{t('Query_description')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('Subject')}</Field.Label>
					<Field.Row>
						<TextInput
							id='subject'
							value={subject.value}
							error={subject.error}
							onChange={(e) => {
								setSubject(e.currentTarget.value);
							}}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Email_body')}</Field.Label>
					<Field.Row>
						<TextAreaInput
							id='emailBody'
							rows={10}
							value={emailBody}
							onChange={(e) => setEmailBody(e.currentTarget.value)}
						/>
					</Field.Row>
					<Field.Hint dangerouslySetInnerHTML={{ __html: t('Mailer_body_tags') }}></Field.Hint>
				</Field>
			</FieldGroup>
			<Button primary width='fit-content' alignSelf='flex-end' onClick={() => { sendMail({ fromEmail, dryRun, query, subject, emailBody }); }}><Icon name='send' size='x20' mie='x8'/>{t('Send_email')}</Button>
		</Page.ContentShadowScroll>
	</Page>;
}
