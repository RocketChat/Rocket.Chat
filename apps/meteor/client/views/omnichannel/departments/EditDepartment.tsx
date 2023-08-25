import type { ILivechatDepartment, ILivechatDepartmentAgents, Serialized } from '@rocket.chat/core-typings';
import {
	FieldGroup,
	Field,
	TextInput,
	Box,
	Icon,
	Divider,
	ToggleSwitch,
	TextAreaInput,
	ButtonGroup,
	Button,
	PaginatedSelectFiltered,
} from '@rocket.chat/fuselage';
import { useMutableCallback, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useMethod, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { validateEmail } from '../../../../lib/emailValidator';
import Page from '../../../components/Page';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useRoomsList } from '../../../hooks/useRoomsList';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { useFormsSubscription } from '../additionalForms';
import DepartmentsAgentsTable from './DepartmentAgentsTable/DepartmentAgentsTable';
import { DepartmentTags } from './DepartmentTags';

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
});

function EditDepartment({ data, id, title, allowedToForwardData }: EditDepartmentProps) {
	const t = useTranslation();
	const departmentsRoute = useRoute('omnichannel-departments');
	const queryClient = useQueryClient();

	const {
		useEeNumberInput = () => null,
		useEeTextInput = () => null,
		useEeTextAreaInput = () => null,
		useDepartmentForwarding = () => null,
		useDepartmentBusinessHours = () => null,
		useSelectForwardDepartment = () => null,
	} = useFormsSubscription();

	const { department, agents = [] } = data || {};

	const MaxChats = useEeNumberInput();
	const VisitorInactivity = useEeNumberInput();
	const WaitingQueueMessageInput = useEeTextAreaInput();
	const AbandonedMessageInput = useEeTextInput();
	const DepartmentForwarding = useDepartmentForwarding();
	const DepartmentBusinessHours = useDepartmentBusinessHours();
	const AutoCompleteDepartment = useSelectForwardDepartment();

	const initialValues = getInitialValues({ department, agents, allowedToForwardData });

	const {
		register,
		control,
		handleSubmit,
		watch,
		formState: { errors, isValid, isDirty },
	} = useForm<FormValues>({ mode: 'onChange', defaultValues: initialValues });

	const requestTagBeforeClosingChat = watch('requestTagBeforeClosingChat');
	const offlineMessageChannelName = watch('offlineMessageChannelName');

	const { itemsList: RoomsList, loadMoreItems: loadMoreRooms } = useRoomsList(
		useMemo(() => ({ text: offlineMessageChannelName }), [offlineMessageChannelName]),
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
			departmentsRoute.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleReturn = useMutableCallback(() => {
		departmentsRoute.push({});
	});

	const isFormValid = isValid && isDirty;

	const formId = useUniqueId();

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={title}>
					<ButtonGroup>
						<Button icon='back' onClick={handleReturn}>
							{t('Back')}
						</Button>
						<Button type='submit' form={formId} primary disabled={!isFormValid}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.ScrollableContentWithShadow>
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
							<Box display='flex' data-qa='DepartmentEditToggle-Enabled' flexDirection='row'>
								<Field.Label>{t('Enabled')}</Field.Label>
								<Field.Row>
									<ToggleSwitch flexGrow={1} {...register('enabled')} />
								</Field.Row>
							</Box>
						</Field>

						<Field>
							<Field.Label>{t('Name')}*</Field.Label>
							<Field.Row>
								<TextInput
									data-qa='DepartmentEditTextInput-Name'
									flexGrow={1}
									error={errors.name?.message as string}
									placeholder={t('Name')}
									{...register('name', { required: t('The_field_is_required', 'name') })}
								/>
							</Field.Row>
							{errors.name && <Field.Error>{errors.name?.message}</Field.Error>}
						</Field>

						<Field>
							<Field.Label>{t('Description')}</Field.Label>
							<Field.Row>
								<TextAreaInput
									data-qa='DepartmentEditTextInput-Description'
									flexGrow={1}
									placeholder={t('Description')}
									{...register('description')}
								/>
							</Field.Row>
						</Field>

						<Field>
							<Box data-qa='DepartmentEditToggle-ShowOnRegistrationPage' display='flex' flexDirection='row'>
								<Field.Label>{t('Show_on_registration_page')}</Field.Label>
								<Field.Row>
									<ToggleSwitch flexGrow={1} {...register('showOnRegistration')} />
								</Field.Row>
							</Box>
						</Field>

						<Field>
							<Field.Label>{t('Email')}*</Field.Label>
							<Field.Row>
								<TextInput
									data-qa='DepartmentEditTextInput-Email'
									flexGrow={1}
									error={errors.email?.message as string}
									addon={<Icon name='mail' size='x20' />}
									placeholder={t('Email')}
									{...register('email', {
										required: t('The_field_is_required', 'email'),
										validate: (email) => validateEmail(email) || t('error-invalid-email-address'),
									})}
								/>
							</Field.Row>
							{errors.email && <Field.Error>{errors.email?.message}</Field.Error>}
						</Field>

						<Field>
							<Box display='flex' data-qa='DepartmentEditToggle-ShowOnOfflinePage' flexDirection='row'>
								<Field.Label>{t('Show_on_offline_page')}</Field.Label>
								<Field.Row>
									<ToggleSwitch flexGrow={1} {...register('showOnOfflineForm')} />
								</Field.Row>
							</Box>
						</Field>

						<Field>
							<Field.Label>{t('Livechat_DepartmentOfflineMessageToChannel')}</Field.Label>
							<Field.Row>
								<Controller
									control={control}
									name='offlineMessageChannelName'
									render={({ field: { value, onChange } }) => (
										<PaginatedSelectFiltered
											data-qa='DepartmentSelect-LivechatDepartmentOfflineMessageToChannel'
											value={value}
											onChange={onChange}
											flexShrink={0}
											filter={value}
											setFilter={onChange}
											options={roomsItems}
											placeholder={t('Channel_name')}
											endReached={
												roomsPhase === AsyncStatePhase.LOADING ? () => undefined : (start) => loadMoreRooms(start, Math.min(50, roomsTotal))
											}
										/>
									)}
								/>
							</Field.Row>
						</Field>

						{MaxChats && (
							<Field>
								<Controller
									control={control}
									name='maxNumberSimultaneousChat'
									render={({ field: { value, onChange } }) => (
										<MaxChats
											value={value}
											handler={onChange}
											label='Max_number_of_chats_per_agent'
											placeholder='Max_number_of_chats_per_agent_description'
										/>
									)}
								/>
							</Field>
						)}

						{VisitorInactivity && (
							<Field>
								<Controller
									control={control}
									name='visitorInactivityTimeoutInSeconds'
									render={({ field: { value, onChange } }) => (
										<VisitorInactivity
											value={value}
											handler={onChange}
											label='How_long_to_wait_to_consider_visitor_abandonment_in_seconds'
											placeholder='Number_in_seconds'
										/>
									)}
								/>
							</Field>
						)}

						{AbandonedMessageInput && (
							<Field>
								<Controller
									control={control}
									name='abandonedRoomsCloseCustomMessage'
									render={({ field: { value, onChange } }) => (
										<AbandonedMessageInput
											value={value}
											handler={onChange}
											label='Livechat_abandoned_rooms_closed_custom_message'
											placeholder='Enter_a_custom_message'
										/>
									)}
								/>
							</Field>
						)}

						{WaitingQueueMessageInput && (
							<Field>
								<Controller
									control={control}
									name='waitingQueueMessage'
									render={({ field: { value, onChange } }) => (
										<WaitingQueueMessageInput
											value={value}
											handler={onChange}
											label='Waiting_queue_message'
											placeholder='Waiting_queue_message'
										/>
									)}
								/>
							</Field>
						)}

						{DepartmentForwarding && (
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
						)}

						{AutoCompleteDepartment && (
							<Field>
								<Field.Label>{t('Fallback_forward_department')}</Field.Label>
								<Controller
									control={control}
									name='fallbackForwardDepartment'
									render={({ field: { value, onChange } }) => (
										<AutoCompleteDepartment
											haveNone
											excludeDepartmentId={department?._id}
											value={value}
											onChange={onChange}
											onlyMyDepartments
											showArchived
										/>
									)}
								/>
							</Field>
						)}

						<Field>
							<Box display='flex' data-qa='DiscussionToggle-RequestTagBeforeCLosingChat' flexDirection='row'>
								<Field.Label>{t('Request_tag_before_closing_chat')}</Field.Label>
								<Field.Row>
									<ToggleSwitch
										data-qa='DiscussionToggle-RequestTagBeforeCLosingChat'
										flexGrow={1}
										{...register('requestTagBeforeClosingChat')}
									/>
								</Field.Row>
							</Box>
						</Field>

						{requestTagBeforeClosingChat && (
							<Field>
								<Field.Label alignSelf='stretch'>{t('Conversation_closing_tags')}*</Field.Label>
								<Controller
									control={control}
									name='chatClosingTags'
									rules={{ required: t('The_field_is_required', 'tags') }}
									render={({ field: { value, onChange } }) => (
										<DepartmentTags value={value} onChange={onChange} error={errors.chatClosingTags?.message as string} />
									)}
								/>
								{errors.chatClosingTags && <Field.Error>{errors.chatClosingTags?.message}</Field.Error>}
							</Field>
						)}

						{DepartmentBusinessHours && (
							<Field>
								<DepartmentBusinessHours bhId={department?.businessHourId} />
							</Field>
						)}

						<Divider mb={16} />
						<Field>
							<Field.Label mb={4}>{t('Agents')}:</Field.Label>
							<Box display='flex' flexDirection='column' height='50vh'>
								<DepartmentsAgentsTable control={control} register={register} />
							</Box>
						</Field>
					</FieldGroup>
				</Page.ScrollableContentWithShadow>
			</Page>
		</Page>
	);
}

export default EditDepartment;
