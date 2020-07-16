import React, { useCallback, useMemo } from 'react';
import { Field, TextInput, TextAreaInput, MultiSelectFiltered, Box, ToggleSwitch, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { isEmail } from '../../../app/utils/lib/isEmail.js';
import VerticalBar from '../../components/basic/VerticalBar';
import CustomFieldsForm from './CustomFieldsForm';


export default function UserForm({ formValues, formHandlers, availableRoles, append, prepend, ...props }) {
	const t = useTranslation();

	const {
		name,
		username,
		email,
		verified,
		statusText,
		bio,
		password,
		setRandomPassword,
		requirePasswordChange,
		roles,
		customFields,
		joinDefaultChannels,
		sendWelcomeEmail,
	} = formValues;

	const {
		handleName,
		handleUsername,
		handleEmail,
		handleVerified,
		handleStatusText,
		handleBio,
		handlePassword,
		handleSetRandomPassword,
		handleRequirePasswordChange,
		handleRoles,
		handleCustomFields,
		handleJoinDefaultChannels,
		handleSendWelcomeEmail,
	} = formHandlers;

	return <VerticalBar.ScrollableContent is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} { ...props }>
		{ prepend }
		{useMemo(() => <Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={name} onChange={handleName}/>
			</Field.Row>
		</Field>, [t, name, handleName])}
		{useMemo(() => <Field>
			<Field.Label>{t('Username')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={username} onChange={handleUsername} addon={<Icon name='at' size='x20'/>}/>
			</Field.Row>
		</Field>, [t, username, handleUsername])}
		{useMemo(() => <Field>
			<Field.Label>{t('Email')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={email} error={!isEmail(email) && email.length > 0 ? 'error' : undefined} onChange={handleEmail} addon={<Icon name='mail' size='x20'/>}/>
			</Field.Row>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mbs='x4'>
					<Box>{t('Verified')}</Box><ToggleSwitch checked={verified} onChange={handleVerified} />
				</Box>
			</Field.Row>
		</Field>, [t, email, handleEmail, verified, handleVerified])}
		{useMemo(() => <Field>
			<Field.Label>{t('StatusMessage')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={statusText} onChange={handleStatusText} addon={<Icon name='edit' size='x20'/>}/>
			</Field.Row>
		</Field>, [t, statusText, handleStatusText])}
		{useMemo(() => <Field>
			<Field.Label>{t('Bio')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows={3} flexGrow={1} value={bio} onChange={handleBio} addon={<Icon name='edit' size='x20' alignSelf='center'/>}/>
			</Field.Row>
		</Field>, [bio, handleBio, t])}
		{useMemo(() => <Field>
			<Field.Label>{t('Password')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={password} onChange={handlePassword} addon={<Icon name='key' size='x20'/>}/>
			</Field.Row>
		</Field>, [t, password, handlePassword])}
		{useMemo(() => <Field>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box>{t('Require_password_change')}</Box><ToggleSwitch disabled={setRandomPassword} checked={setRandomPassword || requirePasswordChange} onChange={handleRequirePasswordChange} />
				</Box>
			</Field.Row>
		</Field>, [t, setRandomPassword, requirePasswordChange, handleRequirePasswordChange])}
		{useMemo(() => <Field>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box>{t('Set_random_password_and_send_by_email')}</Box><ToggleSwitch checked={setRandomPassword} onChange={handleSetRandomPassword} />
				</Box>
			</Field.Row>
		</Field>, [t, setRandomPassword, handleSetRandomPassword])}
		{useMemo(() => <Field>
			<Field.Label>{t('Roles')}</Field.Label>
			<Field.Row>
				<MultiSelectFiltered options={availableRoles} value={roles} onChange={handleRoles} placeholder={t('Select_role')} flexShrink={1}/>
			</Field.Row>
		</Field>, [availableRoles, handleRoles, roles, t])}
		{useMemo(() => handleJoinDefaultChannels && <Field>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box>{t('Join_default_channels')}</Box><ToggleSwitch checked={joinDefaultChannels} onChange={handleJoinDefaultChannels} />
				</Box>
			</Field.Row>
		</Field>, [handleJoinDefaultChannels, t, joinDefaultChannels])}
		{useMemo(() => handleSendWelcomeEmail && <Field>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box>{t('Send_welcome_email')}</Box><ToggleSwitch checked={sendWelcomeEmail} onChange={handleSendWelcomeEmail} />
				</Box>
			</Field.Row>
		</Field>, [handleSendWelcomeEmail, t, sendWelcomeEmail])}
		<CustomFieldsForm customFieldsData={customFields} setCustomFieldsData={handleCustomFields}/>
		{ append }
	</VerticalBar.ScrollableContent>;
}
