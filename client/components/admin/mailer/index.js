import React from 'react';
import { TextInput, TextAreaInput, Field, FieldGroup, CheckBox } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { GroupPage } from '../settings/GroupPage';
import { Page } from '../../basic/Page';


export function Mailer() {
	const t = useTranslation();
	return <Page _id='mailer' i18nLabel='Mailer'>
		<Page.Header title={t('Mailer')}></Page.Header>
		<Page.ContentShadowScroll >
			<FieldGroup>
				<Field>
					<Field.Label>{t('From')}</Field.Label>
					<Field.Row>
						<TextInput placeholder={t('Type_your_email')}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox id='dry-run'/>
						<Field.Label htmlFor='dry-run'>{t('Dry_run')}</Field.Label>
					</Field.Row>
					<Field.Hint>{t('Dry_run_description')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('Query')}</Field.Label>
					<Field.Row>
						<TextInput />
					</Field.Row>
					<Field.Hint>{t('Query_description')}</Field.Hint>
				</Field>
				<Field>
					<Field.Label>{t('Subject')}</Field.Label>
					<Field.Row>
						<TextInput />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Email_body')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={10} />
					</Field.Row>
					<Field.Hint dangerouslySetInnerHTML={{ __html: t('Mailer_body_tags') }}></Field.Hint>
				</Field>
			</FieldGroup>
		</Page.ContentShadowScroll>
	</Page>;
}
