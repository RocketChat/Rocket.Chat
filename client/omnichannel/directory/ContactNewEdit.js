import React, { useState } from 'react';
import { Field, TextInput, Icon, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';


import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from '../../components/basic/VerticalBar';
import { useForm } from '../../hooks/useForm';
import { isEmail } from '../../../app/utils';
import { useComponentDidUpdate } from '../../hooks/useComponentDidUpdate';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { FormSkeleton } from './Skeleton';

const initialValues = {
	name: '',
	email: '',
	phone: '',
};

const getInitialValues = (data) => {
	if (!data) {
		return initialValues;
	}

	const { contact } = data;
	const { name, phone, visitorEmails } = contact;

	return {
		name: name ?? '',
		email: visitorEmails ? visitorEmails[0].address : '',
		phone: phone ? phone[0].phoneNumber : '',
	};
};

export function ContactEditWithData({ id, reload, close }) {
	const t = useTranslation();
	const { data, state, error } = useEndpointDataExperimental(`contact?contactId=${ id }`);

	if ([state].includes(ENDPOINT_STATES.LOADING)) {
		return <FormSkeleton/>;
	}

	if (error || !data || !data.contact) {
		return <Box mbs='x16'>{t('Contact_not_found')}</Box>;
	}

	return <ContactNewEdit id={id} data={data} reload={reload} close={close} />;
}

export function ContactNewEdit({ id, data, reload, close }) {
	const t = useTranslation();

	const { values, handlers } = useForm(getInitialValues(data));

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

		if (id) { payload._id = id; }

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

	return <>
		<VerticalBar.ScrollableContent is='form'>
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
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup stretch>
				<Button flexGrow={1} type='reset'>{t('Cancel')}</Button>
				<Button mie='none' flexGrow={1} onClick={handleSave} disabled={!formIsValid} primary>{t('Save')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</>;
}
