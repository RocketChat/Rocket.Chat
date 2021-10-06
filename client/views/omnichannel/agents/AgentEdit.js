import {
	Field,
	TextInput,
	Button,
	Margins,
	Box,
	MultiSelect,
	Icon,
	Select,
} from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useRef, useState } from 'react';
import { useSubscription } from 'use-subscription';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import VerticalBar from '../../../components/VerticalBar';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useForm } from '../../../hooks/useForm';
import UserInfo from '../../room/contextualBar/UserInfo';
import { formsSubscription } from '../additionalForms';

function AgentEdit({ data, userDepartments, availableDepartments, uid, reset, ...props }) {
	const t = useTranslation();
	const agentsRoute = useRoute('omnichannel-agents');
	const [maxChatUnsaved, setMaxChatUnsaved] = useState();

	const { user } = data || { user: {} };
	const { name, username, statusLivechat } = user;

	const email = getUserEmailAddress(user);
	const options = useMemo(
		() =>
			availableDepartments && availableDepartments.departments
				? availableDepartments.departments.map(({ _id, name }) => [_id, name || _id])
				: [],
		[availableDepartments],
	);
	const initialDepartmentValue = useMemo(
		() =>
			userDepartments && userDepartments.departments
				? userDepartments.departments.map(({ departmentId }) => departmentId)
				: [],
		[userDepartments],
	);
	const eeForms = useSubscription(formsSubscription);

	const saveRef = useRef({ values: {}, hasUnsavedChanges: false });

	const onChangeMaxChats = useMutableCallback(({ hasUnsavedChanges, ...value }) => {
		saveRef.current = value;

		if (hasUnsavedChanges !== maxChatUnsaved) {
			setMaxChatUnsaved(hasUnsavedChanges);
		}
	});

	const { useMaxChatsPerAgent = () => {} } = eeForms;

	const { values, handlers, hasUnsavedChanges, commit } = useForm({
		departments: initialDepartmentValue,
		status: statusLivechat,
		maxChats: 0,
	});
	const { reset: resetMaxChats, commit: commitMaxChats } = saveRef.current;

	const { handleDepartments, handleStatus } = handlers;
	const { departments, status } = values;

	const MaxChats = useMaxChatsPerAgent();

	const saveAgentInfo = useMethod('livechat:saveAgentInfo');
	const saveAgentStatus = useMethod('livechat:changeLivechatStatus');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleReset = useMutableCallback(() => {
		reset();
		resetMaxChats();
	});

	const handleSave = useMutableCallback(async () => {
		try {
			await saveAgentInfo(uid, saveRef.current.values, departments);
			await saveAgentStatus({ status, agentId: uid });
			dispatchToastMessage({ type: 'success', message: t('saved') });
			agentsRoute.push({});
			reset();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		commit();
		commitMaxChats();
	});

	return (
		<VerticalBar.ScrollableContent is='form' {...props}>
			<Box alignSelf='center'>
				<UserInfo.Avatar margin='auto' size={'x332'} title={username} username={username} />
			</Box>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={name} disabled />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Username')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={username} disabled addon={<Icon name='at' size='x20' />} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Email')}</Field.Label>
				<Field.Row>
					<TextInput flexGrow={1} value={email} disabled addon={<Icon name='mail' size='x20' />} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Departments')}</Field.Label>
				<Field.Row>
					<MultiSelect
						options={options}
						value={departments}
						placeholder={t('Select_an_option')}
						onChange={handleDepartments}
						flexGrow={1}
					/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Status')}</Field.Label>
				<Field.Row>
					<Select
						options={[
							['available', t('Available')],
							['not-available', t('Not_Available')],
						]}
						value={status}
						placeholder={t('Select_an_option')}
						onChange={handleStatus}
						flexGrow={1}
					/>
				</Field.Row>
			</Field>

			{MaxChats && <MaxChats data={user} onChange={onChangeMaxChats} />}

			<Field.Row>
				<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
					<Margins inlineEnd='x4'>
						<Button
							flexGrow={1}
							type='reset'
							disabled={!hasUnsavedChanges && !maxChatUnsaved}
							onClick={handleReset}
						>
							{t('Reset')}
						</Button>
						<Button
							mie='none'
							flexGrow={1}
							disabled={!hasUnsavedChanges && !maxChatUnsaved}
							onClick={handleSave}
						>
							{t('Save')}
						</Button>
					</Margins>
				</Box>
			</Field.Row>
		</VerticalBar.ScrollableContent>
	);
}

export default AgentEdit;
