import React, { useState } from 'react';
import { Field, TextInput, Icon, Box, Margins, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';


import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from '../../components/basic/VerticalBar';
import { useForm } from '../../hooks/useForm';
import { isEmail } from '../../../app/utils';
import { useComponentDidUpdate } from '../../hooks/useComponentDidUpdate';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';


const initialValues = {
	name: '',
	email: '',
	phone: '',
};

export function ContactNew({ reload, close }) {
	const t = useTranslation();
	const { values, handlers } = useForm(initialValues);

	const {
		handleName,
		handleEmail,
		handlePhone,
	} = handlers;
	const {
		name,
		email,
		phone,
	} = values;

	const handleCancel = useMutableCallback(() => {

	});

	const [nameError, setNameError] = useState();
	const [emailError, setEmailError] = useState();

	const saveContact = useEndpointAction('POST', 'contact');

	const dispatchToastMessage = useToastMessageDispatch();

	useComponentDidUpdate(() => {
		setNameError(!name ? t('The_field_is_required', t('Name')) : '');
	}, [t, name]);
	useComponentDidUpdate(() => {
		setEmailError(!isEmail(email) ? t('Validate_email_address') : '');
	}, [t, email]);

	const handleSave = useMutableCallback(async (e) => {
		e.preventDefault();
		let error = false;
		if (!name) {
			setNameError(t('The_field_is_required', 'name'));
			error = true;
		}
		if (email && !isEmail(email)) {
			setEmailError(t('Validate_email_address'));
			error = true;
		}

		if (error) {
			return;
		}

		const payload = {
			name,
			email,
			phone,
		};

		try {
			await saveContact(payload);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload();
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const formIsValid = name;

	return <VerticalBar.ScrollableContent is='form'>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput error={nameError} flexGrow={1} value={name} onChange={handleName} placeholder={t('Insert_Contact_Name')} />
			</Field.Row>
			<Field.Error>
				{nameError}
			</Field.Error>
		</Field>
		<Field>
			<Field.Label>{t('Email')}</Field.Label>
			<Field.Row>
				<TextInput error={emailError} flexGrow={1} value={email} onChange={handleEmail} placeholder='example@domain.com' addon={<Icon name='mail' size='x20'/>}/>
			</Field.Row>
			<Field.Error>
				{t(emailError)}
			</Field.Error>
		</Field>
		<Field>
			<Field.Label>{t('Phone')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={phone} onChange={handlePhone} />
			</Field.Row>
		</Field>
		<Field.Row>
			<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
				<Margins inlineEnd='x4'>
					<Button flexGrow={1} type='reset' onClick={handleCancel}>{t('Cancel')}</Button>
					<Button mie='none' flexGrow={1} onClick={handleSave} disabled={!formIsValid} primary>{t('Save')}</Button>
				</Margins>
			</Box>
		</Field.Row>
	</VerticalBar.ScrollableContent>;
}
