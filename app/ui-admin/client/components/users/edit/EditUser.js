import React, { useMemo, useState } from 'react';
import { Field, TextInput, Box, Headline, Skeleton, ToggleSwitch, Icon, TextAreaInput, MultiSelectFiltered, Margins } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';

export function EditUserWithData({ username, ...props }) {
	const t = useTranslation();
	const { data, state, error } = useEndpointDataExperimental('GET', 'users.info', useMemo(() => ({ username }), [username]));

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box w='full' pb='x24' {...props}>
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (error) {
		return <Box mbs='x16' {...props}>{t('User_not_found')}</Box>;
	}

	return <EditUser data={data.user} {...props}/>;
}

export function EditUser({ data }) {
	const t = useTranslation();

	const [newData, setNewData] = useState({});

	const areEqual = (a, b) => a === b || !(a || b);
	const handleChange = (field, currentValue, getValue = (e) => e.currentTarget.value) => (e) => setNewData({ ...newData, [field]: areEqual(getValue(e), currentValue) ? null : getValue(e) });

	const { roles } = data;
	const name = newData.name ?? data.name ?? '';
	const username = newData.username ?? data.username;
	const status = newData.status ?? data.status;
	const bio = newData.bio ?? data.bio ?? '';
	const email = newData.email ?? data.emails[0].address;
	const emailVerified = newData.verified ?? data.emails[0].verified;
	const requirePasswordChange = newData.requirePasswordChange || false;
	const availableRoles = ['teste, teste2, teste4'];
	return <Box mbs='x24'>
		<Margins blockEnd='x16'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={name} onChange={handleChange('name', data.name)}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Username')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={username} onChange={handleChange('username', data.username)} addon={<Icon name='at' size='x20'/>}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Email')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={email} onChange={handleChange('email', data.emails[0].address)} addon={<Icon name='mail' size='x20'/>}/>
				</Field.Row>
				<Field.Row>
					<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mbs='x4'>
						<Box>{t('Verified')}</Box><ToggleSwitch checked={emailVerified} onChange={handleChange('verified', data.emails[0].verified)} />
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Status_message')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={status} onChange={handleChange('status', data.status)} addon={<Icon name='edit' size='x20'/>}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Bio')}</Field.Label>
				<Field.Row>
					<TextAreaInput flexGrow={1} value={bio} onChange={handleChange('bio', data.bio)} addon={<Icon name='edit' size='x20'/>}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Password')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={bio} onChange={handleChange('password', '')} addon={<Icon name='edit' size='x20'/>}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
						<Box>{t('Require_password_change')}</Box><ToggleSwitch checked={requirePasswordChange} onChange={handleChange('requirePasswordChange', false)} />
					</Box>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Roles')}</Field.Label>
				<Field.Row>
					<MultiSelectFiltered placeholder={t('Select_a_role')} options={availableRoles} value={[1, 2]} />
				</Field.Row>
			</Field>
		</Margins>
	</Box>;
}
