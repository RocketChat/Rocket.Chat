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
} from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useMethod, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import { validateEmail } from '../../../../lib/emailValidator';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import Page from '../../../components/Page';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useRoomsList } from '../../../hooks/useRoomsList';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { EeTextInput, EeTextAreaInput, EeNumberInput, DepartmentForwarding, DepartmentBusinessHours } from '../additionalForms';
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
						<Button type='submit' form={formId} primary disabled={!isFormValid} loading={isSubmitting}>
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
								<FieldLabel>{t('Enabled')}</FieldLabel>
								<FieldRow>
									<ToggleSwitch flexGrow={1} {...register('enabled')} />
								</FieldRow>
							</Box>
						</Field>

						<Field>
							<FieldLabel>{t('Name')}*</FieldLabel>
							<FieldRow>
								<TextInput
									data-qa='DepartmentEditTextInput-Name'
									flexGrow={1}
									error={errors.name?.message as string}
									placeholder={t('Name')}
									{...register('name', { required: t('The_field_is_required', 'name') })}
								/>
							</FieldRow>
							{errors.name && <FieldError>{errors.name?.message}</FieldError>}
						</Field>

						<Field>
							<FieldLabel>{t('Description')}</FieldLabel>
							<FieldRow>
								<TextAreaInput
									data-qa='DepartmentEditTextInput-Description'
									flexGrow={1}
									placeholder={t('Description')}
									{...register('description')}
								/>
							</FieldRow>
						</Field>

						<Field>
							<Box data-qa='DepartmentEditToggle-ShowOnRegistrationPage' display='flex' flexDirection='row'>
								<FieldLabel>{t('Show_on_registration_page')}</FieldLabel>
								<FieldRow>
									<ToggleSwitch flexGrow={1} {...register('showOnRegistration')} />
								</FieldRow>
							</Box>
						</Field>

						<Field>
							<FieldLabel>{t('Email')}*</FieldLabel>
							<FieldRow>
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
							</FieldRow>
							{errors.email && <FieldError>{errors.email?.message}</FieldError>}
						</Field>

						<Field>
							<Box display='flex' data-qa='DepartmentEditToggle-ShowOnOfflinePage' flexDirection='row'>
								<FieldLabel>{t('Show_on_offline_page')}</FieldLabel>
								<FieldRow>
									<ToggleSwitch flexGrow={1} {...register('showOnOfflineForm')} />
								</FieldRow>
							</Box>
						</Field>

						<Field>
							<FieldLabel>{t('Livechat_DepartmentOfflineMessageToChannel')}</FieldLabel>
							<FieldRow>
								<Controller
									control={control}
									name='offlineMessageChannelName'
									render={({ field: { value, onChange } }) => (
										<PaginatedSelectFiltered
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

						<Field>
							<Controller
								control={control}
								name='maxNumberSimultaneousChat'
								render={({ field: { value, onChange } }) => (
									<EeNumberInput
										value={value}
										handler={onChange}
										label='Max_number_of_chats_per_agent'
										placeholder='Max_number_of_chats_per_agent_description'
									/>
								)}
							/>
						</Field>

						<Field>
							<Controller
								control={control}
								name='visitorInactivityTimeoutInSeconds'
								render={({ field: { value, onChange } }) => (
									<EeNumberInput
										value={value}
										handler={onChange}
										label='How_long_to_wait_to_consider_visitor_abandonment_in_seconds'
										placeholder='Number_in_seconds'
									/>
								)}
							/>
						</Field>

						<Field>
							<Controller
								control={control}
								name='abandonedRoomsCloseCustomMessage'
								render={({ field: { value, onChange } }) => (
									<EeTextInput
										value={value}
										handler={onChange}
										label='Livechat_abandoned_rooms_closed_custom_message'
										placeholder='Enter_a_custom_message'
									/>
								)}
							/>
						</Field>

						<Field>
							<Controller
								control={control}
								name='waitingQueueMessage'
								render={({ field: { value, onChange } }) => (
									<EeTextAreaInput value={value} handler={onChange} label='Waiting_queue_message' placeholder='Waiting_queue_message' />
								)}
							/>
						</Field>

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

						{hasLicense && (
							<Field>
								<FieldLabel>{t('Fallback_forward_department')}</FieldLabel>
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
								<FieldLabel>{t('Request_tag_before_closing_chat')}</FieldLabel>
								<FieldRow>
									<ToggleSwitch
										data-qa='DiscussionToggle-RequestTagBeforeCLosingChat'
										flexGrow={1}
										{...register('requestTagBeforeClosingChat')}
									/>
								</FieldRow>
							</Box>
						</Field>

						{requestTagBeforeClosingChat && (
							<Field>
								<FieldLabel alignSelf='stretch'>{t('Conversation_closing_tags')}*</FieldLabel>
								<Controller
									control={control}
									name='chatClosingTags'
									rules={{ required: t('The_field_is_required', 'tags') }}
									render={({ field: { value, onChange } }) => (
										<DepartmentTags value={value} onChange={onChange} error={errors.chatClosingTags?.message as string} />
									)}
								/>
								{errors.chatClosingTags && <FieldError>{errors.chatClosingTags?.message}</FieldError>}
							</Field>
						)}

						<Field>
							<DepartmentBusinessHours bhId={department?.businessHourId} />
						</Field>

						<Divider mb={16} />
						<Field>
							<FieldLabel mb={4}>{t('Agents')}:</FieldLabel>
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
