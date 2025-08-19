import type { ILivechatAgent, ILivechatAgentStatus, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { Field, FieldLabel, FieldGroup, FieldRow, TextInput, Button, Box, Icon, Select, ButtonGroup } from '@rocket.chat/fuselage';
import type { SelectOption } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useSetting, useMethod, useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useMemo } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import AutoCompleteDepartmentMultiple from '../../../components/AutoCompleteDepartmentMultiple';
import {
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarHeader,
	ContextualbarScrollableContent,
	ContextualbarFooter,
} from '../../../components/Contextualbar';
import { UserInfoAvatar } from '../../../components/UserInfo';
import { omnichannelQueryKeys } from '../../../lib/queryKeys';
import { MaxChatsPerAgent } from '../additionalForms';

type AgentEditFormData = {
	name: string | undefined;
	username: string | undefined;
	email: string | undefined;
	departments: { label: string; value: string }[];
	status: ILivechatAgentStatus;
	maxNumberSimultaneousChat: number;
	voipExtension: string;
};

type AgentEditProps = {
	agentData: Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'statusLivechat' | 'emails' | 'livechat'>;
	agentDepartments: (Pick<ILivechatDepartmentAgents, 'departmentId'> & { departmentName: string })[];
};

const AgentEdit = ({ agentData, agentDepartments }: AgentEditProps) => {
	const t = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();

	const voipEnabled = useSetting('VoIP_Enabled');
	const dispatchToastMessage = useToastMessageDispatch();

	const { name, username, livechat, statusLivechat } = agentData;

	const email = getUserEmailAddress(agentData);

	const statusOptions: SelectOption[] = useMemo(
		() => [
			['available', t('Available')],
			['not-available', t('Not_Available')],
		],
		[t],
	);

	const initialDepartmentValue = useMemo(
		() => agentDepartments.map(({ departmentName, departmentId }) => ({ label: departmentName, value: departmentId })) || [],
		[agentDepartments],
	);

	const methods = useForm<AgentEditFormData>({
		values: {
			name,
			username,
			email,
			departments: initialDepartmentValue,
			status: statusLivechat,
			maxNumberSimultaneousChat: livechat?.maxNumberSimultaneousChat || 0,
			voipExtension: '',
		},
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { isDirty },
	} = methods;

	const saveAgentInfo = useMethod('livechat:saveAgentInfo');
	const saveAgentStatus = useEndpoint('POST', '/v1/livechat/agent.status');

	const handleSave = useEffectEvent(async ({ status, departments, ...data }: AgentEditFormData) => {
		try {
			await saveAgentStatus({ agentId: agentData._id, status });
			await saveAgentInfo(
				agentData._id,
				data,
				departments.map((dep) => dep.value),
			);
			dispatchToastMessage({ type: 'success', message: t('Success') });
			router.navigate('/omnichannel/agents');

			queryClient.invalidateQueries({ queryKey: omnichannelQueryKeys.agents() });
			queryClient.invalidateQueries({ queryKey: omnichannelQueryKeys.agentDepartments(agentData._id) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const formId = useId();
	const nameField = useId();
	const usernameField = useId();
	const emailField = useId();
	const departmentsFieldId = useId();
	const statusField = useId();
	const voipExtensionField = useId();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Edit_User')}</ContextualbarTitle>
				<ContextualbarClose onClick={() => router.navigate('/omnichannel/agents')} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<FormProvider {...methods}>
					<form id={formId} onSubmit={handleSubmit(handleSave)}>
						{username && (
							<Box display='flex' flexDirection='column' alignItems='center'>
								<UserInfoAvatar username={username} />
							</Box>
						)}
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor={nameField}>{t('Name')}</FieldLabel>
								<FieldRow>
									<Controller
										name='name'
										control={control}
										render={({ field }) => <TextInput id={nameField} data-qa-id='agent-edit-name' {...field} readOnly />}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel htmlFor={usernameField}>{t('Username')}</FieldLabel>
								<FieldRow>
									<Controller
										name='username'
										control={control}
										render={({ field }) => <TextInput id={usernameField} {...field} readOnly addon={<Icon name='at' size='x20' />} />}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel htmlFor={emailField}>{t('Email')}</FieldLabel>
								<FieldRow>
									<Controller
										name='email'
										control={control}
										render={({ field }) => <TextInput id={emailField} {...field} readOnly addon={<Icon name='mail' size='x20' />} />}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel id={departmentsFieldId}>{t('Departments')}</FieldLabel>
								<FieldRow>
									<Controller
										name='departments'
										control={control}
										render={({ field }) => (
											<AutoCompleteDepartmentMultiple aria-labelledby={departmentsFieldId} withCheckbox showArchived {...field} />
										)}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel htmlFor={statusField}>{t('Status')}</FieldLabel>
								<FieldRow>
									<Controller
										name='status'
										control={control}
										render={({ field }) => (
											<Select
												id={statusField}
												data-qa-id='agent-edit-status'
												{...field}
												options={statusOptions}
												placeholder={t('Select_an_option')}
											/>
										)}
									/>
								</FieldRow>
							</Field>
							{MaxChatsPerAgent && <MaxChatsPerAgent />}
							{voipEnabled && (
								<Field>
									<FieldLabel htmlFor={voipExtensionField}>{t('VoIP_Extension')}</FieldLabel>
									<FieldRow>
										<Controller
											name='voipExtension'
											control={control}
											render={({ field }) => <TextInput id={voipExtensionField} {...field} />}
										/>
									</FieldRow>
								</Field>
							)}
						</FieldGroup>
					</form>
				</FormProvider>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button type='reset' disabled={!isDirty} onClick={() => reset()}>
						{t('Reset')}
					</Button>
					<Button form={formId} primary type='submit' data-qa-id='agent-edit-save' disabled={!isDirty}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AgentEdit;
