import React, { useMemo, useState, useCallback } from 'react';
import { Field, TextInput, Box, ToggleSwitch, Icon, TextAreaInput, MultiSelectFiltered, Margins, Button } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { isEmail } from '../../../app/utils/lib/isEmail.js';
import { useRoute } from '../../contexts/RouterContext';
import VerticalBar from '../../components/basic/VerticalBar';


export function AddUser({ roles, ...props }) {
	const t = useTranslation();

	const [newData, setNewData] = useState({});

	const router = useRoute('admin-users');

	const roleData = useEndpointData('roles.list', '') || {};

	const goToUser = (id) => router.push({
		context: 'info',
		id,
	});

	const saveQuery = useMemo(() => ({
		...Object.fromEntries(Object.entries(newData).filter(([, value]) => value !== null)),
	}), [JSON.stringify(newData)]);

	const saveAction = useEndpointAction('POST', 'users.create', saveQuery, t('User_created_successfully'));

	const handleSave = async () => {
		if (Object.keys(newData).length) {
			const result = await saveAction();
			if (result.success) {
				goToUser(result.user._id);
			}
		}
	};

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: getValue(e) });

	const {
		roles: selectedRoles = [],
		name = '',
		username = '',
		statusText = '',
		bio = '',
		email = '',
		password = '',
		verified = false,
		requirePasswordChange = false,
		setRandomPassword = false,
		sendWelcomeEmail = true,
		joinDefaultChannels = true,
	} = newData;

	const availableRoles = roleData && roleData.roles ? roleData.roles.map(({ _id, description }) => [_id, description || _id]) : [];

	return <VerticalBar.ScrollableContent is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} { ...props }>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={name} onChange={handleChange('name')}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Username')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={username} onChange={handleChange('username')} addon={<Icon name='at' size='x20'/>}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Email')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={email} error={!isEmail(email) && email.length > 0 ? 'error' : undefined} onChange={handleChange('email')} addon={<Icon name='mail' size='x20'/>}/>
			</Field.Row>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mbs='x4'>
					<Box>{t('Verified')}</Box><ToggleSwitch checked={verified} onChange={handleChange('verified', () => !verified)} />
				</Box>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('StatusMessage')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={statusText} onChange={handleChange('statusText')} addon={<Icon name='edit' size='x20'/>}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Bio')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows={3} flexGrow={1} value={bio} onChange={handleChange('bio')} addon={<Icon name='edit' size='x20' alignSelf='center'/>}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Password')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={password} onChange={handleChange('password')} addon={<Icon name='key' size='x20'/>}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box>{t('Require_password_change')}</Box><ToggleSwitch disabled={setRandomPassword} checked={setRandomPassword || requirePasswordChange} onChange={handleChange('requirePasswordChange', () => !requirePasswordChange)} />
				</Box>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box>{t('Set_random_password_and_send_by_email')}</Box><ToggleSwitch checked={setRandomPassword} onChange={handleChange('setRandomPassword', () => !setRandomPassword)} />
				</Box>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Roles')}</Field.Label>
			<Field.Row>
				<MultiSelectFiltered options={availableRoles} value={selectedRoles} onChange={handleChange('roles', (value) => value)} placeholder={t('Select_role')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box>{t('Join_default_channels')}</Box><ToggleSwitch checked={joinDefaultChannels} onChange={handleChange('joinDefaultChannels', () => !joinDefaultChannels)} />
				</Box>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box>{t('Send_welcome_email')}</Box><ToggleSwitch checked={sendWelcomeEmail} onChange={handleChange('sendWelcomeEmail', () => !sendWelcomeEmail)} />
				</Box>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
					<Margins inlineEnd='x4'>
						<Button flexGrow={1} onClick={() => setNewData({})}>{t('Cancel')}</Button>
						<Button mie='none' flexGrow={1} onClick={handleSave}>{t('Save')}</Button>
					</Margins>
				</Box>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
