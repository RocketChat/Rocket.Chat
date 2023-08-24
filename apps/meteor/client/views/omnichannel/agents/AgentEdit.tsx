import type { ILivechatAgent, ILivechatDepartment, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { Field, TextInput, Button, Box, MultiSelect, Icon, Select, ContextualbarFooter, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useSetting, useMethod, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { FC, ReactElement } from 'react';
import React, { useMemo, useRef, useState } from 'react';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import { ContextualbarScrollableContent } from '../../../components/Contextualbar';
import UserInfo from '../../../components/UserInfo';
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
	availableDepartments: { departments: Pick<ILivechatDepartment, '_id' | 'name' | 'archived'>[] };
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

	const options: [string, string][] = useMemo(() => {
		const archivedDepartment = (name: string, archived?: boolean) => (archived ? `${name} [${t('Archived')}]` : name);

		return availableDepartments?.departments
			? availableDepartments.departments.map(({ _id, name, archived }) =>
					name ? [_id, archivedDepartment(name, archived)] : [_id, archivedDepartment(_id, archived)],
			  )
			: [];
	}, [availableDepartments.departments, t]);

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
			await saveAgentStatus({ status, agentId: uid });
			await saveAgentInfo(uid, saveRef.current.values, departments);
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
		<>
			<ContextualbarScrollableContent is='form' {...props}>
				{username && (
					<Box alignSelf='center'>
						<UserInfo.Avatar data-qa='AgentEdit-Avatar' username={username} />
					</Box>
				)}
				<Field>
					<Field.Label>{t('Name')}</Field.Label>
					<Field.Row>
						<TextInput data-qa='AgentEditTextInput-Name' value={name} disabled />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Username')}</Field.Label>
					<Field.Row>
						<TextInput data-qa='AgentEditTextInput-Username' value={username} disabled addon={<Icon name='at' size='x20' />} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Email')}</Field.Label>
					<Field.Row>
						<TextInput data-qa='AgentEditTextInput-Email' value={email} disabled addon={<Icon name='mail' size='x20' />} />
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
						/>
					</Field.Row>
				</Field>
				{MaxChats && <MaxChats data={user} onChange={onChangeMaxChats} />}
				{voipEnabled && (
					<Field>
						<Field.Label>{t('VoIP_Extension')}</Field.Label>
						<Field.Row>
							<TextInput data-qa='AgentEditTextInput-VoIP_Extension' value={voipExtension as string} onChange={handleVoipExtension} />
						</Field.Row>
					</Field>
				)}
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup wrap>
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
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AgentEdit;
