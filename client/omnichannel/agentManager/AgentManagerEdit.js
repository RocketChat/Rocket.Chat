import React, { useMemo } from 'react';
import { Field, TextInput, Button, Margins, Box, MultiSelect, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from '../../components/basic/VerticalBar';
import UserAvatar from '../../components/basic/avatar/UserAvatar';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { FormSkeleton } from './Skeleton';
import { useForm } from '../../hooks/useForm';
import { useRoute } from '../../contexts/RouterContext';


export default function AgentEditWithData({ uid }) {
	const { data, state } = useEndpointDataExperimental(`livechat/users/agent/${ uid }`);
	const { data: userDepartments, state: userDepartmentsState } = useEndpointDataExperimental(`livechat/agents/${ uid }/departments`);
	const { data: availableDepartments, state: availableDepartmentsState } = useEndpointDataExperimental('livechat/department');

	if ([state, availableDepartmentsState, userDepartmentsState].includes(ENDPOINT_STATES.LOADING)) {
		return <FormSkeleton/>;
	}

	return <AgentEdit uid={uid} data={data} userDepartments={userDepartments} availableDepartments={availableDepartments}/>;
}

export function AgentEdit({ data, userDepartments, availableDepartments, uid, ...props }) {
	const t = useTranslation();
	const agentsRoute = useRoute('omnichannel-agents');

	const options = useMemo(() => (availableDepartments && availableDepartments.departments ? availableDepartments.departments.map(({ _id, name }) => [_id, name || _id]) : []), [availableDepartments]);
	const initialDepartmentValue = useMemo(() => (userDepartments && userDepartments.departments ? userDepartments.departments.map(({ departmentId }) => departmentId) : []), [userDepartments]);

	const { values, handlers, reset, hasUnsavedChanges } = useForm({ departments: initialDepartmentValue });

	const {
		handleDepartments,
	} = handlers;
	const {
		departments,
	} = values;

	const { user } = data || { user: {} };
	const {
		name,
		username,
		email,
	} = user;

	const saveAgentInfo = useMethod('livechat:saveAgentInfo');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleSave = useMutableCallback(async () => {
		try {
			saveAgentInfo(uid, {}, departments);
			dispatchToastMessage({ type: 'success', message: t('saved') });
			agentsRoute.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t(error) });
		}
	});

	return <VerticalBar.ScrollableContent is='form' { ...props }>
		<UserAvatar margin='auto' size={'x332'} title={username} username={username}/>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={name} disabled/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Username')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={username} disabled addon={<Icon name='at' size='x20'/>}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Email')}</Field.Label>
			<Field.Row>
				<TextInput flexGrow={1} value={email} disabled addon={<Icon name='mail' size='x20'/>}/>
			</Field.Row>
		</Field>

		<Field.Row>
			<MultiSelect options={options} value={departments} placeholder={t('Select_an_option')} onChange={handleDepartments} flexGrow={1}/>
		</Field.Row>

		<Field.Row>
			<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
				<Margins inlineEnd='x4'>
					<Button flexGrow={1} type='reset' disabled={!hasUnsavedChanges} onClick={reset}>{t('Reset')}</Button>
					<Button mie='none' flexGrow={1} disabled={!hasUnsavedChanges} onClick={handleSave}>{t('Save')}</Button>
				</Margins>
			</Box>
		</Field.Row>
	</VerticalBar.ScrollableContent>;
}
