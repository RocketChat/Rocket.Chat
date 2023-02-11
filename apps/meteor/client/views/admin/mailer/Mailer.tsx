import { TextInput, TextAreaInput, Field, FieldGroup, CheckBox, Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { SyntheticEvent, ReactElement } from 'react';
import React, { useState, useCallback } from 'react';

import { validateEmail } from '../../../../lib/emailValidator';
import { isJSON } from '../../../../lib/utils/isJSON';
import Page from '../../../components/Page';
import type { sendMailObject } from './MailerRoute';

type MailerProps = {
	sendMail: ({ fromEmail, subject, emailBody, dryRun, query }: sendMailObject) => void;
};

export function Mailer({ sendMail }: MailerProps): ReactElement {
	const t = useTranslation();

	const [fromEmail, setFromEmail] = useState<{ value: string; error?: string }>({ value: '' });
	const [dryRun, setDryRun] = useState(false);
	const [query, setQuery] = useState<{ value: string; error?: string }>({ value: '' });
	const [subject, setSubject] = useState('');
	const [emailBody, setEmailBody] = useState('');

	return (
		<Page>
			<Page.Header title={t('Mailer')}>
				<ButtonGroup align='end'>
					<Button
						primary
						onClick={(): void => {
							sendMail({ fromEmail, dryRun, query, subject, emailBody });
						}}
					>
						<Icon name='send' size='x20' mie='x8' />
						{t('Send_email')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow alignSelf='center' w='100%' display='flex' flexDirection='column' alignItems='center'>
				<FieldGroup maxWidth='x600' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} method='post'>
					<Field>
						<Field.Label>{t('From')}</Field.Label>
						<Field.Row>
							<TextInput
								id='fromEmail'
								placeholder={t('Type_your_email')}
								value={fromEmail.value}
								error={fromEmail.error}
								onChange={(e: SyntheticEvent<HTMLInputElement>): void => {
									setFromEmail({
										value: e.currentTarget.value,
										error: !validateEmail(e.currentTarget.value) ? t('Invalid_email') : undefined,
									});
								}}
							/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Row>
							<CheckBox id='dryRun' checked={dryRun} onChange={(): void => setDryRun(!dryRun)} />
							<Field.Label htmlFor='dry-run'>{t('Dry_run')}</Field.Label>
						</Field.Row>
						<Field.Hint>{t('Dry_run_description')}</Field.Hint>
					</Field>
					<Field>
						<Field.Label>{t('Query')}</Field.Label>
						<Field.Row>
							<TextInput
								id='query'
								value={query.value}
								error={query.error}
								onChange={(e: SyntheticEvent<HTMLInputElement>): void => {
									setQuery({
										value: e.currentTarget.value,
										error: e.currentTarget.value && !isJSON(e.currentTarget.value) ? t('Invalid_JSON') : undefined,
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
								value={subject}
								onChange={(e: SyntheticEvent<HTMLInputElement>): void => {
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
								onChange={(e: SyntheticEvent<HTMLInputElement>): void => setEmailBody(e.currentTarget.value)}
							/>
						</Field.Row>
						<Field.Hint dangerouslySetInnerHTML={{ __html: t('Mailer_body_tags') }} />
					</Field>
				</FieldGroup>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}
