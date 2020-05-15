import React, { useMemo, useState, useCallback } from 'react';
import { Field, TextInput, Box, Skeleton, ToggleSwitch, Icon, TextAreaInput, MultiSelectFiltered, Margins, Button } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { useEndpointUpload } from '../../hooks/useEndpointUpload';
import { isEmail } from '../../../app/utils/lib/isEmail.js';
import { useRoute } from '../../contexts/RouterContext';
import UserAvatarEditor from '../../components/basic/avatar/UserAvatarEditor';
import VerticalBar from '../../components/basic/VerticalBar';

export function EditUserWithData({ userId, ...props }) {
	const t = useTranslation();
	const roleData = useEndpointData('roles.list', '') || {};
	const { data, state, error } = useEndpointDataExperimental('users.info', useMemo(() => ({ userId }), [userId]));

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box w='full' pb='x24' {...props}>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (error) {
		return <Box mbs='x16' {...props}>{t('User_not_found')}</Box>;
	}

	return <EditUser data={data.user} roles={roleData.roles} {...props}/>;
}

export function EditUser({ data, roles, ...props }) {
	const t = useTranslation();

	const [newData, setNewData] = useState({});
	const [avatarObj, setAvatarObj] = useState();
	const hasUnsavedChanges = useMemo(() => Object.values(newData).filter((current) => current === null).length < Object.keys(newData).length, [JSON.stringify(newData)]) || avatarObj;

	const router = useRoute('admin-users');

	const goToUser = (id) => router.push({
		context: 'info',
		id,
	});

	const saveQuery = useMemo(() => ({
		userId: data._id,
		data: Object.fromEntries(Object.entries(newData).filter(([, value]) => value !== null)),
	}), [data._id, JSON.stringify(newData)]);

	const saveAvatarQuery = useMemo(() => ({
		userId: data._id,
		avatarUrl: avatarObj && avatarObj.avatarUrl,
	}), [data._id, JSON.stringify(avatarObj)]);

	const resetAvatarQuery = useMemo(() => ({
		userId: data._id,
	}), [data._id]);

	const saveAction = useEndpointAction('POST', 'users.update', saveQuery, t('User_updated_successfully'));
	const saveAvatarAction = useEndpointUpload('users.setAvatar', saveAvatarQuery, t('Avatar_changed_successfully'));
	const saveAvatarUrlAction = useEndpointAction('POST', 'users.setAvatar', saveAvatarQuery, t('Avatar_changed_successfully'));
	const resetAvatarAction = useEndpointAction('POST', 'users.resetAvatar', resetAvatarQuery, t('Avatar_changed_successfully'));

	const updateAvatar = async () => {
		if (avatarObj === 'reset') {
			return resetAvatarAction();
		}
		if (avatarObj.avatarUrl) {
			return saveAvatarUrlAction();
		}
		return saveAvatarAction(avatarObj);
	};

	const handleSave = async () => {
		if (hasUnsavedChanges) {
			const result = await saveAction();
			if (result.success) {
				if (avatarObj) {
					await updateAvatar();
				}
				goToUser(data._id);
			}
		}
	};

	const rolesAreEqual = (a, b) => {
		if (a.length !== b.length) { return false; }
		const result = a.reduce((acc, aValue) => {
			const onlyOneMatches = b.reduce((acc, bValue) => (aValue === bValue ? acc + 1 : acc + 0), 0) === 1;
			return onlyOneMatches ? acc + 1 : acc + 0;
		}, 0);
		return result === a.length;
	};

	const testEqual = (a, b) => a === b || !(a || b);
	const handleChange = (field, currentValue, getValue = (e) => e.currentTarget.value, areEqual = testEqual) => (e) => setNewData({ ...newData, [field]: areEqual(getValue(e), currentValue) ? null : getValue(e) });

	const availableRoles = roles.map(({ _id, description }) => [_id, description || _id]);
	const selectedRoles = newData.roles ?? data.roles;
	const name = newData.name ?? data.name ?? '';
	const username = newData.username ?? data.username;
	const status = newData.status ?? data.status;
	const bio = newData.bio ?? data.bio ?? '';
	const email = newData.email ?? (data.emails && data.emails[0].address);
	const emailVerified = newData.verified ?? (data.emails && data.emails[0].verified);
	const setRandomPassword = newData.setRandomPassword || false;
	const requirePasswordChange = setRandomPassword || newData.requirePasswordChange || false;

	return <VerticalBar.ScrollableContent is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} qa-admin-user-edit='form' { ...props }>
		<UserAvatarEditor username={data.username} setAvatarObj={setAvatarObj}/>
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
				<TextInput flexGrow={1} value={email} error={!isEmail(email) ? 'error' : undefined} onChange={handleChange('email', data.emails && data.emails[0].address)} addon={<Icon name='mail' size='x20'/>}/>
			</Field.Row>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mbs='x4'>
					<Box>{t('Verified')}</Box><ToggleSwitch checked={emailVerified} onChange={handleChange('verified', data.emails && data.emails[0].verified, () => !emailVerified)} />
				</Box>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('StatusMessage')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={status} onChange={handleChange('status', data.status)} addon={<Icon name='edit' size='x20'/>}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Bio')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows={3} flexGrow={1} value={bio} onChange={handleChange('bio', data.bio)} addon={<Icon name='edit' size='x20' alignSelf='center'/>}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Password')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={newData.password || ''} onChange={handleChange('password', '')} addon={<Icon name='key' size='x20'/>}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box>{t('Require_password_change')}</Box><ToggleSwitch checked={requirePasswordChange} disabled={setRandomPassword} onChange={handleChange('requirePasswordChange', false, () => !requirePasswordChange)} />
				</Box>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
					<Box>{t('Set_random_password_and_send_by_email')}</Box><ToggleSwitch checked={setRandomPassword} onChange={handleChange('setRandomPassword', false, () => !setRandomPassword)} />
				</Box>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Roles')}</Field.Label>
			<Field.Row>
				<MultiSelectFiltered options={availableRoles} value={selectedRoles} onChange={handleChange('roles', data.roles, (value) => value, rolesAreEqual)} placeholder={t('Select_role')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
					<Margins inlineEnd='x4'>
						<Button flexGrow={1} type='reset' disabled={!hasUnsavedChanges} onClick={() => setNewData({})}>{t('Reset')}</Button>
						<Button mie='none' flexGrow={1} disabled={!hasUnsavedChanges} onClick={handleSave}>{t('Save')}</Button>
					</Margins>
				</Box>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
