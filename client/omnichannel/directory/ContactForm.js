import React, { useState, useMemo } from 'react';
import { Field, TextInput, Icon, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSubscription } from 'use-subscription';

import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from '../../components/VerticalBar';
import { useForm } from '../../hooks/useForm';
import { isEmail } from '../../../app/utils';
import { useComponentDidUpdate } from '../../hooks/useComponentDidUpdate';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { FormSkeleton } from './Skeleton';
import CustomFieldsForm from '../../components/CustomFieldsForm';
import { hasAtLeastOnePermission } from '../../../app/authorization';
import { AsyncStatePhase } from '../../hooks/useAsyncState';
import { formsSubscription } from '../../views/omnichannel/additionalForms';
import { createToken } from '../../components/helpers';

const initialValues = {
	token: '',
	name: '',
	email: '',
	phone: '',
	username: '',
};

const getInitialValues = (data) => {
	if (!data) {
		return initialValues;
	}

	const { contact: { name, token, phone, visitorEmails, livechatData, contactManager } } = data;

	return {
		token: token ?? '',
		name: name ?? '',
		email: visitorEmails ? visitorEmails[0].address : '',
		phone: phone ? phone[0].phoneNumber : '',
		livechatData: livechatData ?? '',
		username: contactManager?.username ?? '',
	};
};

export function ContactEditWithData({ id, reload, close }) {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`omnichannel/contact?contactId=${ id }`);

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton/>;
	}

	if (error || !data || !data.contact) {
		return <Box mbs='x16'>{t('Contact_not_found')}</Box>;
	}

	return <ContactNewEdit id={id} data={data} reload={reload} close={close} />;
}

export function ContactNewEdit({ id, data, reload, close }) {
	const t = useTranslation();

	const canViewCustomFields = () => hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const { values, handlers } = useForm(getInitialValues(data));
	const eeForms = useSubscription(formsSubscription);

	const {
		useContactManager = () => {},
	} = eeForms;

	const ContactManager = useContactManager();

	const {
		handleName,
		handleEmail,
		handlePhone,
		handleUsername,
	} = handlers;
	const {
		token,
		name,
		email,
		phone,
		username,
	} = values;

	const { values: valueCustom, handlers: handleValueCustom } = useForm({
		livechatData: values.livechatData,
	});

	const { handleLivechatData } = handleValueCustom;
	const { livechatData } = valueCustom;

	const [nameError, setNameError] = useState();
	const [emailError, setEmailError] = useState();
	const [phoneError] = useState();

	const { value: allCustomFields, phase: state } = useEndpointData('livechat/custom-fields');

	const jsonConverterToValidFormat = (customFields) => {
		const jsonObj = {};
		// eslint-disable-next-line no-return-assign
		customFields.map(({ _id, visibility, options, scope, defaultValue, required }) =>
			(visibility === 'visible' & scope === 'visitor')
			&& (jsonObj[_id] = {
				type: options ? 'select' : 'text',
				required,
				defaultValue,
				options: options && options.split(',').map((item) => item.trim()),
			}));
		return jsonObj;
	};

	const jsonCustomField = useMemo(() => (allCustomFields
		&& allCustomFields.customFields
		? jsonConverterToValidFormat(allCustomFields.customFields) : {}), [allCustomFields]);

	const saveContact = useEndpointAction('POST', 'omnichannel/contact');

	const dispatchToastMessage = useToastMessageDispatch();

	useComponentDidUpdate(() => {
		setNameError(!name ? t('The_field_is_required', t('Name')) : '');
	}, [t, name]);
	useComponentDidUpdate(() => {
		setEmailError(email && !isEmail(email) ? t('Validate_email_address') : undefined);
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

		if (id) {
			payload._id = id;
			payload.token = token;
		} else {
			payload.token = createToken();
		}
		if (livechatData) { payload.livechatData = livechatData; }
		if (username) { payload.contactManager = { username }; }

		try {
			await saveContact(payload);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload();
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const formIsValid = name && !emailError;


	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton/>;
	}

	return <>
		<VerticalBar.ScrollableContent is='form'>
			<Field>
				<Field.Label>{t('Name')}*</Field.Label>
				<Field.Row>
					<TextInput error={nameError} flexGrow={1} value={name} onChange={handleName} />
				</Field.Row>
				<Field.Error>
					{nameError}
				</Field.Error>
			</Field>
			<Field>
				<Field.Label>{t('Email')}</Field.Label>
				<Field.Row>
					<TextInput error={emailError} flexGrow={1} value={email} onChange={handleEmail} addon={<Icon name='mail' size='x20'/>}/>
				</Field.Row>
				<Field.Error>
					{t(emailError)}
				</Field.Error>
			</Field>
			<Field>
				<Field.Label>{t('Phone')}</Field.Label>
				<Field.Row>
					<TextInput error={phoneError} flexGrow={1} value={phone} onChange={handlePhone} />
				</Field.Row>
				<Field.Error>
					{t(phoneError)}
				</Field.Error>
			</Field>
			{ canViewCustomFields() && allCustomFields
			&& <CustomFieldsForm jsonCustomFields={jsonCustomField} customFieldsData={livechatData} setCustomFieldsData={handleLivechatData} /> }
			{ ContactManager && <ContactManager value={username} handler={handleUsername} /> }
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup stretch>
				<Button flexGrow={1} onClick={close}>{t('Cancel')}</Button>
				<Button mie='none' flexGrow={1} onClick={handleSave} disabled={!formIsValid} primary>{t('Save')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</>;
}
