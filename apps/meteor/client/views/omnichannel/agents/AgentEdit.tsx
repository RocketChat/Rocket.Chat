import type { ILivechatAgent, ILivechatAgentStatus, ILivechatDepartment, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import {
	Field,
	FieldLabel,
	FieldGroup,
	FieldRow,
	TextInput,
	Button,
	Box,
	MultiSelect,
	Icon,
	Select,
	ContextualbarFooter,
	ButtonGroup,
	CheckOption,
} from '@rocket.chat/fuselage';
import type { SelectOption } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useSetting, useMethod, useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useMemo } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import {
	Contextualbar,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarHeader,
	ContextualbarScrollableContent,
} from '../../../components/Contextualbar';
import { UserInfoAvatar } from '../../../components/UserInfo';
import { MaxChatsPerAgent } from '../additionalForms';

type AgentEditFormData = {
	name: string | undefined;
	username: string | undefined;
	email: string | undefined;
	departments: string[];
	status: ILivechatAgentStatus;
	maxNumberSimultaneousChat: number;
	voipExtension: string;
};

type AgentEditProps = {
	agentData: Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'statusLivechat' | 'emails' | 'livechat'>;
	userDepartments: (Pick<ILivechatDepartmentAgents, 'departmentId'> & { departmentName: string })[];
	availableDepartments: Pick<ILivechatDepartment, '_id' | 'name' | 'archived'>[];
};

const AgentEdit = ({ agentData, userDepartments, availableDepartments }: AgentEditProps) => {
	const t = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();

	const voipEnabled = useSetting('VoIP_Enabled');
	const dispatchToastMessage = useToastMessageDispatch();

	const { name, username, livechat, statusLivechat } = agentData;

	const email = getUserEmailAddress(agentData);

	const departments: Pick<ILivechatDepartment, '_id' | 'name' | 'archived'>[] = useMemo(() => {
		const pending = userDepartments
			.filter(({ departmentId }) => !availableDepartments.find((dep) => dep._id === departmentId))
			.map((dep) => ({
				_id: dep.departmentId,
				name: dep.departmentName,
			}));

		return [...availableDepartments, ...pending];
	}, [availableDepartments, userDepartments]);

	const departmentsOptions: SelectOption[] = useMemo(() => {
		const archivedDepartment = (name: string, archived?: boolean) => (archived ? `${name} [${t('Archived')}]` : name);

		return (
			departments.map(({ _id, name, archived }) =>
				name ? [_id, archivedDepartment(name, archived)] : [_id, archivedDepartment(_id, archived)],
			) || []
		);
	}, [departments, t]);

	const statusOptions: SelectOption[] = useMemo(
		() => [
			['available', t('Available')],
			['not-available', t('Not_Available')],
		],
		[t],
	);

	const initialDepartmentValue = useMemo(() => userDepartments.map(({ departmentId }) => departmentId) || [], [userDepartments]);

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
			await saveAgentInfo(agentData._id, data, departments);
			dispatchToastMessage({ type: 'success', message: t('Success') });
			router.navigate('/omnichannel/agents');
			queryClient.invalidateQueries({
				queryKey: ['livechat-agents'],
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const formId = useId();
	const nameField = useId();
	const usernameField = useId();
	const emailField = useId();
	const departmentsField = useId();
	const statusField = useId();
	const voipExtensionField = useId();

	return (
		<Contextualbar data-qa-id='agent-edit-contextual-bar'>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Edit_User')}</ContextualbarTitle>
				<ContextualbarClose onClick={() => router.navigate('/omnichannel/agents')} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<FormProvider {...methods}>
					<form id={formId} onSubmit={handleSubmit(handleSave)}>
						{username && (
							<Box display='flex' flexDirection='column' alignItems='center'>
								<UserInfoAvatar data-qa-id='agent-edit-avatar' username={username} />
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
										render={({ field }) => (
											<TextInput
												id={usernameField}
												data-qa-id='agent-edit-username'
												{...field}
												readOnly
												addon={<Icon name='at' size='x20' />}
											/>
										)}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel htmlFor={emailField}>{t('Email')}</FieldLabel>
								<FieldRow>
									<Controller
										name='email'
										control={control}
										render={({ field }) => (
											<TextInput
												id={emailField}
												data-qa-id='agent-edit-email'
												{...field}
												readOnly
												addon={<Icon name='mail' size='x20' />}
											/>
										)}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel htmlFor={departmentsField}>{t('Departments')}</FieldLabel>
								<FieldRow>
									<Controller
										name='departments'
										control={control}
										render={({ field }) => (
											<MultiSelect
												id={departmentsField}
												data-qa-id='agent-edit-departments'
												options={departmentsOptions}
												{...field}
												placeholder={t('Select_an_option')}
												renderItem={({ label, ...props }) => (
													<CheckOption {...props} label={<span style={{ whiteSpace: 'normal' }}>{label}</span>} />
												)}
											/>
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
											render={({ field }) => <TextInput id={voipExtensionField} {...field} data-qa-id='agent-edit-voip-extension' />}
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
					<Button data-qa-id='agent-edit-reset' type='reset' disabled={!isDirty} onClick={() => reset()}>
						{t('Reset')}
					</Button>
					<Button form={formId} primary type='submit' data-qa-id='agent-edit-save' disabled={!isDirty}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</Contextualbar>
	);
};

export default AgentEdit;
