import type { ILivechatDepartment, ILivechatDepartmentAgents, Serialized } from '@rocket.chat/core-typings';
import {
	FieldGroup,
	Field,
	FieldLabel,
	FieldRow,
	FieldError,
	TextInput,
	Box,
	Icon,
	Divider,
	ToggleSwitch,
	TextAreaInput,
	ButtonGroup,
	Button,
	PaginatedSelectFiltered,
	FieldHint,
	Option,
} from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useEndpoint, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import { validateEmail } from '../../../../lib/emailValidator';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useRoomsList } from '../../../hooks/useRoomsList';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { EeTextInput, EeTextAreaInput, EeNumberInput, DepartmentForwarding, DepartmentBusinessHours } from '../additionalForms';
import DepartmentsAgentsTable from './DepartmentAgentsTable/DepartmentAgentsTable';
import DepartmentTags from './DepartmentTags';

export type EditDepartmentProps = {
	id?: string;
	title: string;
	data?: Serialized<{
		department: ILivechatDepartment | null;
		agents?: ILivechatDepartmentAgents[];
	}>;
	allowedToForwardData?: Serialized<{
		departments: ILivechatDepartment[];
	}>;
};

type InitialValueParams = {
	department?: Serialized<ILivechatDepartment> | null;
	agents?: Serialized<ILivechatDepartmentAgents>[];
	allowedToForwardData?: EditDepartmentProps['allowedToForwardData'];
};

export type IDepartmentAgent = Pick<ILivechatDepartmentAgents, 'agentId' | 'username' | 'count' | 'order'> & {
	_id?: string;
	name?: string;
};

export type FormValues = {
	name: string;
	email: string;
	description: string;
	enabled: boolean;
	maxNumberSimultaneousChat: number;
	showOnRegistration: boolean;
	showOnOfflineForm: boolean;
	abandonedRoomsCloseCustomMessage: string;
	requestTagBeforeClosingChat: boolean;
	offlineMessageChannelName: string;
	visitorInactivityTimeoutInSeconds: number;
	waitingQueueMessage: string;
	departmentsAllowedToForward: { label: string; value: string }[];
	fallbackForwardDepartment: string;
	agentList: IDepartmentAgent[];
	chatClosingTags: string[];
	allowReceiveForwardOffline: boolean;
};

function withDefault<T>(key: T | undefined | null, defaultValue: T) {
	return key || defaultValue;
}

const getInitialValues = ({ department, agents, allowedToForwardData }: InitialValueParams) => ({
	name: withDefault(department?.name, ''),
	email: withDefault(department?.email, ''),
	description: withDefault(department?.description, ''),
	enabled: !!department?.enabled,
	maxNumberSimultaneousChat: department?.maxNumberSimultaneousChat,
	showOnRegistration: !!department?.showOnRegistration,
	showOnOfflineForm: !!department?.showOnOfflineForm,
	abandonedRoomsCloseCustomMessage: withDefault(department?.abandonedRoomsCloseCustomMessage, ''),
	requestTagBeforeClosingChat: !!department?.requestTagBeforeClosingChat,
	offlineMessageChannelName: withDefault(department?.offlineMessageChannelName, ''),
	visitorInactivityTimeoutInSeconds: department?.visitorInactivityTimeoutInSeconds,
	waitingQueueMessage: withDefault(department?.waitingQueueMessage, ''),
	departmentsAllowedToForward: allowedToForwardData?.departments?.map((dep) => ({ label: dep.name, value: dep._id })) || [],
	fallbackForwardDepartment: withDefault(department?.fallbackForwardDepartment, ''),
	chatClosingTags: department?.chatClosingTags ?? [],
	agentList: agents || [],
	allowReceiveForwardOffline: withDefault(department?.allowReceiveForwardOffline, false),
});

function EditDepartment({ data, id, title, allowedToForwardData }: EditDepartmentProps) {
	const t = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();

	const { department, agents = [] } = data || {};

	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const initialValues = getInitialValues({ department, agents, allowedToForwardData });

	const {
		register,
		control,
		handleSubmit,
		watch,
		formState: { errors, isValid, isDirty, isSubmitting },
	} = useForm<FormValues>({ mode: 'onChange', defaultValues: initialValues });

	const requestTagBeforeClosingChat = watch('requestTagBeforeClosingChat');

	const [fallbackFilter, setFallbackFilter] = useState<string>('');

	const debouncedFallbackFilter = useDebouncedValue(fallbackFilter, 500);

	const { itemsList: RoomsList, loadMoreItems: loadMoreRooms } = useRoomsList(
		useMemo(() => ({ text: debouncedFallbackFilter }), [debouncedFallbackFilter]),
	);

	const { phase: roomsPhase, items: roomsItems, itemCount: roomsTotal } = useRecordList(RoomsList);

	const saveDepartmentInfo = useMethod('livechat:saveDepartment');
	const saveDepartmentAgentsInfoOnEdit = useEndpoint('POST', `/v1/livechat/department/:_id/agents`, { _id: id || '' });

	const dispatchToastMessage = useToastMessageDispatch();

	const handleSave = useMutableCallback(async (data: FormValues) => {
		const {
			agentList,
			enabled,
			name,
			description,
			showOnRegistration,
			showOnOfflineForm,
			email,
			chatClosingTags,
			offlineMessageChannelName,
			maxNumberSimultaneousChat,
			visitorInactivityTimeoutInSeconds,
			abandonedRoomsCloseCustomMessage,
			waitingQueueMessage,
			departmentsAllowedToForward,
			fallbackForwardDepartment,
			allowReceiveForwardOffline,
		} = data;

		const payload = {
			enabled,
			name,
			description,
			showOnRegistration,
			showOnOfflineForm,
			requestTagBeforeClosingChat,
			email,
			chatClosingTags,
			offlineMessageChannelName,
			maxNumberSimultaneousChat,
			visitorInactivityTimeoutInSeconds,
			abandonedRoomsCloseCustomMessage,
			waitingQueueMessage,
			departmentsAllowedToForward: departmentsAllowedToForward?.map((dep) => dep.value),
			fallbackForwardDepartment,
			allowReceiveForwardOffline,
		};

		try {
			if (id) {
				const { agentList: initialAgentList } = initialValues;

				const agentListPayload = {
					upsert: agentList.filter(
						(agent) =>
							!initialAgentList.some(
								(initialAgent) =>
									initialAgent._id === agent._id && agent.count === initialAgent.count && agent.order === initialAgent.order,
							),
					),
					remove: initialAgentList.filter((initialAgent) => !agentList.some((agent) => initialAgent._id === agent._id)),
				};

				await saveDepartmentInfo(id, payload, []);
				if (agentListPayload.upsert.length > 0 || agentListPayload.remove.length > 0) {
					await saveDepartmentAgentsInfoOnEdit(agentListPayload);
				}
			} else {
				await saveDepartmentInfo(id ?? null, payload, agentList);
			}
			queryClient.invalidateQueries(['/v1/livechat/department/:_id', id]);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			router.navigate('/omnichannel/departments');
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const isFormValid = isValid && isDirty;

	const formId = useUniqueId();
	const enabledField = useUniqueId();
	const nameField = useUniqueId();
	const descriptionField = useUniqueId();
	const showOnRegistrationField = useUniqueId();
	const emailField = useUniqueId();
	const showOnOfflineFormField = useUniqueId();
	const offlineMessageChannelNameField = useUniqueId();
	const fallbackForwardDepartmentField = useUniqueId();
	const requestTagBeforeClosingChatField = useUniqueId();
	const chatClosingTagsField = useUniqueId();
	const allowReceiveForwardOffline = useUniqueId();

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={title} onClickBack={() => router.navigate('/omnichannel/departments')}>
					<ButtonGroup>
						<Button type='submit' form={formId} primary disabled={!isFormValid} loading={isSubmitting}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</PageHeader>
				<PageScrollableContentWithShadow>
					<FieldGroup
						w='full'
						alignSelf='center'
						maxWidth='x600'
						id={formId}
						is='form'
						autoComplete='off'
						onSubmit={handleSubmit(handleSave)}
					>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor={enabledField}>{t('Enabled')}</FieldLabel>
								<ToggleSwitch id={enabledField} {...register('enabled')} />
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={nameField} required>
								{t('Name')}
							</FieldLabel>
							<FieldRow>
								<TextInput
									id={nameField}
									data-qa='DepartmentEditTextInput-Name'
									flexGrow={1}
									error={errors.name?.message as string}
									placeholder={t('Name')}
									{...register('name', { required: t('The_field_is_required', 'name') })}
								/>
							</FieldRow>
							{errors.name && (
								<FieldError aria-live='assertive' id={`${nameField}-error`}>
									{errors.name?.message}
								</FieldError>
							)}
						</Field>
						<Field>
							<FieldLabel htmlFor={descriptionField}>{t('Description')}</FieldLabel>
							<FieldRow>
								<TextAreaInput
									id={descriptionField}
									data-qa='DepartmentEditTextInput-Description'
									placeholder={t('Description')}
									{...register('description')}
								/>
							</FieldRow>
						</Field>
						<Field data-qa='DepartmentEditToggle-ShowOnRegistrationPage'>
							<FieldRow>
								<FieldLabel htmlFor={showOnRegistrationField}>{t('Show_on_registration_page')}</FieldLabel>
								<ToggleSwitch id={showOnRegistrationField} {...register('showOnRegistration')} />
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={emailField} required>
								{t('Email')}
							</FieldLabel>
							<FieldRow>
								<TextInput
									id={emailField}
									data-qa='DepartmentEditTextInput-Email'
									error={errors.email?.message as string}
									addon={<Icon name='mail' size='x20' />}
									placeholder={t('Email')}
									{...register('email', {
										required: t('The_field_is_required', 'email'),
										validate: (email) => validateEmail(email) || t('error-invalid-email-address'),
									})}
									aria-describedby={`${emailField}-error`}
								/>
							</FieldRow>
							{errors.email && (
								<FieldError aria-live='assertive' id={`${emailField}-error`}>
									{errors.email?.message}
								</FieldError>
							)}
						</Field>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor={showOnOfflineFormField}>{t('Show_on_offline_page')}</FieldLabel>
								<ToggleSwitch id={showOnOfflineFormField} {...register('showOnOfflineForm')} />
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={offlineMessageChannelNameField}>{t('Livechat_DepartmentOfflineMessageToChannel')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='offlineMessageChannelName'
									render={({ field: { value, onChange } }) => (
										<PaginatedSelectFiltered
											id={offlineMessageChannelNameField}
											data-qa='DepartmentSelect-LivechatDepartmentOfflineMessageToChannel'
											value={value}
											onChange={onChange}
											flexShrink={0}
											filter={fallbackFilter}
											setFilter={setFallbackFilter as (value?: string | number) => void}
											options={roomsItems}
											placeholder={t('Channel_name')}
											endReached={
												roomsPhase === AsyncStatePhase.LOADING ? () => undefined : (start) => loadMoreRooms(start, Math.min(50, roomsTotal))
											}
											aria-busy={fallbackFilter !== debouncedFallbackFilter}
										/>
									)}
								/>
							</FieldRow>
						</Field>
						{hasLicense && (
							<>
								<Field>
									<Controller
										control={control}
										name='maxNumberSimultaneousChat'
										render={({ field }) => (
											<EeNumberInput
												{...field}
												label={t('Max_number_of_chats_per_agent')}
												placeholder={t('Max_number_of_chats_per_agent_description')}
											/>
										)}
									/>
								</Field>
								<Field>
									<Controller
										control={control}
										name='visitorInactivityTimeoutInSeconds'
										render={({ field }) => (
											<EeNumberInput
												{...field}
												label={t('How_long_to_wait_to_consider_visitor_abandonment_in_seconds')}
												placeholder={t('Number_in_seconds')}
											/>
										)}
									/>
								</Field>
								<Field>
									<Controller
										control={control}
										name='abandonedRoomsCloseCustomMessage'
										render={({ field }) => (
											<EeTextInput
												{...field}
												label={t('Livechat_abandoned_rooms_closed_custom_message')}
												placeholder={t('Enter_a_custom_message')}
											/>
										)}
									/>
								</Field>
								<Field>
									<Controller
										control={control}
										name='waitingQueueMessage'
										render={({ field }) => (
											<EeTextAreaInput {...field} label={t('Waiting_queue_message')} placeholder={t('Waiting_queue_message')} />
										)}
									/>
								</Field>
								<Field>
									<Controller
										control={control}
										name='departmentsAllowedToForward'
										render={({ field: { value, onChange } }) => (
											<DepartmentForwarding
												departmentId={id ?? ''}
												value={value}
												handler={onChange}
												label='List_of_departments_for_forward'
											/>
										)}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor={fallbackForwardDepartmentField}>{t('Fallback_forward_department')}</FieldLabel>
									<Controller
										control={control}
										name='fallbackForwardDepartment'
										render={({ field: { value, onChange } }) => (
											<AutoCompleteDepartment
												id={fallbackForwardDepartmentField}
												haveNone
												excludeDepartmentId={department?._id}
												value={value}
												onChange={onChange}
												onlyMyDepartments
												showArchived
												withTitle={false}
												renderItem={({ label, ...props }) => (
													<Option {...props} label={<span style={{ whiteSpace: 'normal' }}>{label}</span>} />
												)}
											/>
										)}
									/>
								</Field>
							</>
						)}
						<Field>
							<FieldRow>
								<FieldLabel htmlFor={requestTagBeforeClosingChatField}>{t('Request_tag_before_closing_chat')}</FieldLabel>
								<ToggleSwitch id={requestTagBeforeClosingChatField} {...register('requestTagBeforeClosingChat')} />
							</FieldRow>
						</Field>
						<Field>
							<FieldRow>
								<FieldLabel htmlFor={allowReceiveForwardOffline}>{t('Accept_receive_inquiry_no_online_agents')}</FieldLabel>
								<ToggleSwitch id={allowReceiveForwardOffline} {...register('allowReceiveForwardOffline')} />
							</FieldRow>
							<FieldRow>
								<FieldHint id={`${allowReceiveForwardOffline}-hint`}>{t('Accept_receive_inquiry_no_online_agents_Hint')}</FieldHint>
							</FieldRow>
						</Field>
						{requestTagBeforeClosingChat && (
							<Field>
								<FieldLabel htmlFor={chatClosingTagsField} required>
									{t('Conversation_closing_tags')}
								</FieldLabel>
								<Controller
									control={control}
									name='chatClosingTags'
									rules={{ required: t('The_field_is_required', 'tags') }}
									render={({ field: { value, onChange } }) => (
										<DepartmentTags
											id={chatClosingTagsField}
											value={value}
											onChange={onChange}
											error={errors.chatClosingTags?.message as string}
											aria-describedby={`${chatClosingTagsField}-hint ${chatClosingTagsField}-error`}
										/>
									)}
								/>
								<FieldHint id={`${chatClosingTagsField}-hint`}>{t('Conversation_closing_tags_description')}</FieldHint>
								{errors.chatClosingTags && (
									<FieldError aria-live='assertive' id={`${chatClosingTagsField}-error`}>
										{errors.chatClosingTags?.message}
									</FieldError>
								)}
							</Field>
						)}
						<Field>
							<DepartmentBusinessHours bhId={department?.businessHourId} />
						</Field>
						<Divider mb={16} />
						<Field>
							<FieldLabel mb={4}>{t('Agents')}</FieldLabel>
							<Box display='flex' flexDirection='column' height='50vh'>
								<DepartmentsAgentsTable control={control} register={register} />
							</Box>
						</Field>
					</FieldGroup>
				</PageScrollableContentWithShadow>
			</Page>
		</Page>
	);
}

export default EditDepartment;
