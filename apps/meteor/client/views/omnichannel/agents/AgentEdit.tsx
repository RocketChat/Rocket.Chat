import type { ILivechatAgent, ILivechatDepartment, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { Field, TextInput, Button, Margins, Box, MultiSelect, Icon, Select } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useSetting, useMethod, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { FC, ReactElement } from 'react';
import React, { useMemo, useRef, useState } from 'react';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import UserInfo from '../../../components/UserInfo';
import VerticalBar from '../../../components/VerticalBar';
import { useForm } from '../../../hooks/useForm';
import { useFormsSubscription } from '../additionalForms';

// TODO: TYPE:
// Department

type dataType = {
	user: Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'statusLivechat' | 'emails' | 'livechat'>;
};

type AgentEditProps = {
	data: dataType;
	userDepartments: { departments: Pick<ILivechatDepartmentAgents, 'departmentId'>[] };
	availableDepartments: { departments: Pick<ILivechatDepartment, '_id' | 'name'>[] };
	uid: string;
	reset: () => void;
};

const AgentEdit: FC<AgentEditProps> = ({ data, userDepartments, availableDepartments, uid, reset, ...props }) => {
	const t = useTranslation();
	const agentsRoute = useRoute('omnichannel-agents');
	const [maxChatUnsaved, setMaxChatUnsaved] = useState();
	const voipEnabled = useSetting('VoIP_Enabled');

	const { user } = data || { user: {} };
	const { name, username, statusLivechat } = user;

	const email = getUserEmailAddress(user);

	const options: [string, string][] = useMemo(
		() =>
			availableDepartments?.departments ? availableDepartments.departments.map(({ _id, name }) => (name ? [_id, name] : [_id, _id])) : [],
		[availableDepartments],
	);
	const initialDepartmentValue = useMemo(
		() => (userDepartments.departments ? userDepartments.departments.map(({ departmentId }) => departmentId) : []),
		[userDepartments],
	);
	const eeForms = useFormsSubscription();

	const saveRef = useRef({
		values: {},
		hasUnsavedChanges: false,
		reset: () => undefined,
		commit: () => undefined,
	});

	const { reset: resetMaxChats, commit: commitMaxChats } = saveRef.current;

	const onChangeMaxChats = useMutableCallback(({ hasUnsavedChanges, ...value }) => {
		saveRef.current = value;

		if (hasUnsavedChanges !== maxChatUnsaved) {
			setMaxChatUnsaved(hasUnsavedChanges);
		}
	});

	const { useMaxChatsPerAgent = (): ReactElement | null => null } = eeForms as any; // TODO: Find out how to use ts with eeForms

	const { values, handlers, hasUnsavedChanges, commit } = useForm({
		departments: initialDepartmentValue,
		status: statusLivechat,
		maxChats: 0,
		voipExtension: '',
	});

	const { handleDepartments, handleStatus, handleVoipExtension } = handlers;
	const { departments, status, voipExtension } = values as {
		departments: string[];
		status: ILivechatAgent['statusLivechat'];
		voipExtension: string;
	};

	const MaxChats = useMaxChatsPerAgent();

	const saveAgentInfo = useMethod('livechat:saveAgentInfo');
	const saveAgentStatus = useEndpoint('POST', '/v1/livechat/agent.status');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleReset = useMutableCallback(() => {
		reset();
		resetMaxChats();
	});

	const handleSave = useMutableCallback(async () => {
		try {
			await saveAgentInfo(uid, saveRef.current.values, departments);
			await saveAgentStatus({ status, agentId: uid });
			dispatchToastMessage({ type: 'success', message: t('Success') });
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
			{username && (
				<Box alignSelf='center'>
					<UserInfo.Avatar data-qa='AgentEdit-Avatar' username={username} />
				</Box>
			)}
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput data-qa='AgentEditTextInput-Name' flexGrow={1} value={name} disabled />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Username')}</Field.Label>
				<Field.Row>
					<TextInput data-qa='AgentEditTextInput-Username' flexGrow={1} value={username} disabled addon={<Icon name='at' size='x20' />} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Email')}</Field.Label>
				<Field.Row>
					<TextInput data-qa='AgentEditTextInput-Email' flexGrow={1} value={email} disabled addon={<Icon name='mail' size='x20' />} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Departments')}</Field.Label>
				<Field.Row>
					<MultiSelect
						data-qa='AgentEditTextInput-Departaments'
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
						data-qa='AgentEditTextInput-Status'
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

			{voipEnabled && (
				<Field>
					<Field.Label>{t('VoIP_Extension')}</Field.Label>
					<Field.Row>
						<TextInput
							data-qa='AgentEditTextInput-VoIP_Extension'
							flexGrow={1}
							value={voipExtension as string}
							onChange={handleVoipExtension}
						/>
					</Field.Row>
				</Field>
			)}

			<Field.Row>
				<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
					<Margins inlineEnd='x4'>
						<Button
							data-qa='AgentEditButtonReset'
							flexGrow={1}
							type='reset'
							disabled={!hasUnsavedChanges && !maxChatUnsaved}
							onClick={handleReset}
						>
							{t('Reset')}
						</Button>
						<Button
							data-qa='AgentEditButtonSave'
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
};

export default AgentEdit;
