import React, { useReducer } from 'react';
import _ from 'underscore';
import { TextInput, TextAreaInput, Field, FieldGroup, CheckBox, Button, Icon } from '@rocket.chat/fuselage';

import { useMethod } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { Page } from '../../basic/Page';

const reducer = (state, action) => {
	console.log('state', state);
	console.log('action', action);
	const { type, value } = action;
	const error = state[type].verification ? state[type].verification(value) : undefined;
	state[type].value = value;
	state[type].error = error;
	return { ...state };
};

const initialState = {
	'from-email': {
		value: '',
		error: false,
		verification: (value) => !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value),
	},
	'dry-run': {
		value: false,
	},
	query: {
		value: '',
		error: false,
		verification: (value) => {
			try {
				JSON.parse(value);
				return false;
			} catch {
				return true;
			}
		},
	},
	subject: {
		value: '',
		error: false,
		verification: (value) => value.lenght < 1,
	},
	'email-body': {
		value: '',
	},
};

export function Mailer() {
	const meteorSendMail = useMethod('Mailer.sendMail');
	const sendMail = (state) => {
		const { 'from-email': { value: from }, subject: { value: subject }, 'email-body': { value: body }, 'dry-run': { value: dryRun }, query: { value: query } } = state;
		for (const data of state) {
			if (data.error) {
				return false;
			}
		}
		meteorSendMail(from, subject, body, dryRun, query);
	};
	const t = useTranslation();
	const [state, dispatch] = useReducer(reducer, initialState);
	return <Page _id='mailer' i18nLabel='Mailer'>
		<Page.Header title={t('Mailer')}></Page.Header>
		<Page.ContentShadowScroll maxWidth='x600' alignSelf='center' display='flex' flexDirection='column'>
			<FieldGroup is='form' method='post'>
				<Field>
					<Field.Label>{t('From')}</Field.Label>
					<Field.Row>
						<TextInput
							id='from-email'
							placeholder={t('Type_your_email')}
							value={state['from-email'].value}
							error={state['from-email'].error}
							onChange={(e) => {
								dispatch({
									type: 'from-email',
									value: e.currentTarget.value,
								});
							}}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox
							id='dry-run'
							checked={state['dry-run'].value}
							onChange={(e) => {
								dispatch({
									type: 'dry-run',
									value: e.currentTarget.checked,
								});
							}}
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
							value={state.query.value}
							error={state.query.error}
							onChange={(e) => {
								dispatch({
									type: 'query',
									value: e.currentTarget.value,
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
							value={state.subject.value}
							error={state.subject.error}
							onChange={(e) => {
								dispatch({
									type: 'subject',
									value: e.currentTarget.value,
								});
							}}
						/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Email_body')}</Field.Label>
					<Field.Row>
						<TextAreaInput
							id='email-body'
							rows={10}
							value={state['email-body'].value}
							onChange={(e) => {
								dispatch({
									type: 'email-body',
									value: e.currentTarget.value,
								});
							}}
						/>
					</Field.Row>
					<Field.Hint dangerouslySetInnerHTML={{ __html: t('Mailer_body_tags') }}></Field.Hint>
				</Field>
			</FieldGroup>
			<Button primary width='fit-content' alignSelf='flex-end'><Icon name='send' size='x20' mie='x8' onClick={() => { sendMail(state); }}/>{t('Send_email')}</Button>
		</Page.ContentShadowScroll>
	</Page>;
}
