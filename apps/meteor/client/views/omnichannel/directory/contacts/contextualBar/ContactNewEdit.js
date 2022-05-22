import { Field, TextInput, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { hasAtLeastOnePermission } from '../../../../../../app/authorization/client';
import { validateEmail } from '../../../../../../lib/emailValidator';
import CustomFieldsForm from '../../../../../components/CustomFieldsForm';
import VerticalBar from '../../../../../components/VerticalBar';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useComponentDidUpdate } from '../../../../../hooks/useComponentDidUpdate';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { useForm } from '../../../../../hooks/useForm';
import { createToken } from '../../../../../lib/utils/createToken';
import { formsSubscription } from '../../../additionalForms';
import { FormSkeleton } from '../../Skeleton';

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

	const {
		contact: { name, token, phone, visitorEmails, livechatData, contactManager },
	} = data;

	return {
		token: token ?? '',
		name: name ?? '',
		email: visitorEmails ? visitorEmails[0].address : '',
		phone: phone ? phone[0].phoneNumber : '',
		livechatData: livechatData ?? {},
		username: contactManager?.username ?? '',
	};
};

function ContactNewEdit({ id, data, close }) {
	const t = useTranslation();

	const canViewCustomFields = () => hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const { values, handlers, hasUnsavedChanges: hasUnsavedChangesContact } = useForm(getInitialValues(data));

	const eeForms = useSubscription(formsSubscription);

	const { useContactManager = () => {} } = eeForms;

	const ContactManager = useContactManager();

	const { handleName, handleEmail, handlePhone, handleUsername } = handlers;
	const { token, name, email, phone, username } = values;

	const {
		values: valueCustom,
		handlers: handleValueCustom,
		hasUnsavedChanges: hasUnsavedChangesCustomFields,
	} = useForm({
		livechatData: values.livechatData,
	});

	const { handleLivechatData } = handleValueCustom;
	const { livechatData } = valueCustom;

	const [nameError, setNameError] = useState();
	const [emailError, setEmailError] = useState();
	const [phoneError, setPhoneError] = useState();
	const [customFieldsError, setCustomFieldsError] = useState([]);

	const { value: allCustomFields, phase: state } = useEndpointData('livechat/custom-fields');

	const jsonConverterToValidFormat = (customFields) => {
		const jsonObj = {};
		customFields.forEach(({ _id, label, visibility, options, scope, defaultValue, required }) => {
			(visibility === 'visible') & (scope === 'visitor') &&
				(jsonObj[_id] = {
					label,
					type: options ? 'select' : 'text',
					required,
					defaultValue,
					options: options && options.split(',').map((item) => item.trim()),
				});
		});
		return jsonObj;
	};

	const jsonCustomField = useMemo(
		() => (allCustomFields && allCustomFields.customFields ? jsonConverterToValidFormat(allCustomFields.customFields) : {}),
		[allCustomFields],
	);

	const saveContact = useEndpoint('POST', 'omnichannel/contact');
	const emailAlreadyExistsAction = useEndpoint('GET', `omnichannel/contact.search?email=${email}`);
	const phoneAlreadyExistsAction = useEndpoint('GET', `omnichannel/contact.search?phone=${phone}`);

	const checkEmailExists = useMutableCallback(async () => {
		if (!validateEmail(email)) {
			return;
		}
		const { contact } = await emailAlreadyExistsAction();
		if (!contact || (id && contact._id === id)) {
			return setEmailError(null);
		}
		setEmailError(t('Email_already_exists'));
	});

	const checkPhoneExists = useMutableCallback(async () => {
		if (!phone) {
			return;
		}
		const { contact } = await phoneAlreadyExistsAction();
		if (!contact || (id && contact._id === id)) {
			return setPhoneError(null);
		}
		setPhoneError(t('Phone_already_exists'));
	});

	const dispatchToastMessage = useToastMessageDispatch();

	useComponentDidUpdate(() => {
		setNameError(!name ? t('The_field_is_required', t('Name')) : '');
	}, [t, name]);
	useComponentDidUpdate(() => {
		setEmailError(email && !validateEmail(email) ? t('Validate_email_address') : null);
	}, [t, email]);
	useComponentDidUpdate(() => {
		!phone && setPhoneError(null);
	}, [phone]);

	const handleSave = useMutableCallback(async (e) => {
		e.preventDefault();
		let error = false;
		if (!name) {
			setNameError(t('The_field_is_required', 'name'));
			error = true;
		}
		if (email && !validateEmail(email)) {
			setEmailError(t('Validate_email_address'));
			error = true;
		}

		if (error) {
			return;
		}

		const payload = {
			name,
		};
		payload.phone = phone;
		payload.email = email;
		payload.customFields = livechatData || {};
		payload.contactManager = username ? { username } : {};

		if (id) {
			payload._id = id;
			payload.token = token;
		} else {
			payload.token = createToken();
		}

		try {
			await saveContact(payload);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const formIsValid =
		(hasUnsavedChangesContact || hasUnsavedChangesCustomFields) && name && !emailError && !phoneError && customFieldsError.length === 0;

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	return (
		<>
			<VerticalBar.ScrollableContent is='form'>
				<Field>
					<Field.Label>{t('Name')}*</Field.Label>
					<Field.Row>
						<TextInput error={nameError} flexGrow={1} value={name} onChange={handleName} />
					</Field.Row>
					<Field.Error>{nameError}</Field.Error>
				</Field>
				<Field>
					<Field.Label>{t('Email')}</Field.Label>
					<Field.Row>
						<TextInput onBlur={checkEmailExists} error={emailError} flexGrow={1} value={email} onChange={handleEmail} />
					</Field.Row>
					<Field.Error>{t(emailError)}</Field.Error>
				</Field>
				<Field>
					<Field.Label>{t('Phone')}</Field.Label>
					<Field.Row>
						<TextInput onBlur={checkPhoneExists} error={phoneError} flexGrow={1} value={phone} onChange={handlePhone} />
					</Field.Row>
					<Field.Error>{t(phoneError)}</Field.Error>
				</Field>
				{canViewCustomFields() && allCustomFields && (
					<CustomFieldsForm
						jsonCustomFields={jsonCustomField}
						customFieldsData={livechatData}
						setCustomFieldsData={handleLivechatData}
						setCustomFieldsError={setCustomFieldsError}
					/>
				)}
				{ContactManager && <ContactManager value={username} handler={handleUsername} />}
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button flexGrow={1} onClick={close}>
						{t('Cancel')}
					</Button>
					<Button mie='none' flexGrow={1} onClick={handleSave} disabled={!formIsValid} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
}

export default ContactNewEdit;
