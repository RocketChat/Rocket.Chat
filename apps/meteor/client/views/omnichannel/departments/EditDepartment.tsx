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
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useTranslation, useRouter, usePermission } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import type { EditDepartmentFormData } from './definitions';
import { formatAgentListPayload } from './utils/formatAgentListPayload';
import { formatEditDepartmentPayload } from './utils/formatEditDepartmentPayload';
import { getFormInitialValues } from './utils/getFormInititalValues';
import { validateEmail } from '../../../../lib/emailValidator';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { useRoomsList } from '../../../hooks/useRoomsList';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { EeTextInput, EeTextAreaInput, EeNumberInput, DepartmentForwarding, DepartmentBusinessHours } from '../additionalForms';
import DepartmentsAgentsTable from './DepartmentAgentsTable/DepartmentAgentsTable';
import DepartmentTags from './DepartmentTags';
import AutoCompleteUnit from '../../../omnichannel/additionalForms/AutoCompleteUnit';

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

function EditDepartment({ data, id, title, allowedToForwardData }: EditDepartmentProps) {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();

	const { department, agents = [] } = data || {};

	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const canManageUnits = usePermission('manage-livechat-units');

	const initialValues = getFormInitialValues({ department, agents, allowedToForwardData });

	const {
		register,
		control,
		handleSubmit,
		watch,
		formState: { errors, isValid, isDirty, isSubmitting },
	} = useForm<EditDepartmentFormData>({ mode: 'onChange', defaultValues: initialValues });

	const requestTagBeforeClosingChat = watch('requestTagBeforeClosingChat');

	const [fallbackFilter, setFallbackFilter] = useState<string>('');
	const [isUnitRequired, setUnitRequired] = useState(false);

	const debouncedFallbackFilter = useDebouncedValue(fallbackFilter, 500);

	const { itemsList: RoomsList, loadMoreItems: loadMoreRooms } = useRoomsList(
		useMemo(() => ({ text: debouncedFallbackFilter }), [debouncedFallbackFilter]),
	);

	const { phase: roomsPhase, items: roomsItems, itemCount: roomsTotal } = useRecordList(RoomsList);

	const createDepartment = useEndpoint('POST', '/v1/livechat/department');
	const updateDepartmentInfo = useEndpoint('PUT', '/v1/livechat/department/:_id', { _id: id || '' });
	const saveDepartmentAgentsInfoOnEdit = useEndpoint('POST', `/v1/livechat/department/:_id/agents`, { _id: id || '' });

	const handleSave = useEffectEvent(async (data: EditDepartmentFormData) => {
		try {
			const { agentList } = data;
			const payload = formatEditDepartmentPayload(data);
			const departmentUnit = data.unit ? { _id: data.unit } : undefined;

			if (id) {
				await updateDepartmentInfo({
					department: payload,
					agents: [],
					departmentUnit,
				});

				const { agentList: initialAgentList } = initialValues;
				const agentListPayload = formatAgentListPayload(initialAgentList, agentList);

				if (agentListPayload.upsert.length > 0 || agentListPayload.remove.length > 0) {
					await saveDepartmentAgentsInfoOnEdit(agentListPayload);
				}
			} else {
				await createDepartment({
					department: payload,
					agents: agentList.map(({ agentId, count, order }) => ({ agentId, count, order })),
					departmentUnit,
				});
			}

			queryClient.invalidateQueries({ queryKey: ['/v1/livechat/department/:_id', id] });
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			router.navigate('/omnichannel/departments');
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const isFormValid = isValid && isDirty;

	const formId = useId();
	const enabledField = useId();
	const nameField = useId();
	const descriptionField = useId();
	const showOnRegistrationField = useId();
	const emailField = useId();
	const showOnOfflineFormField = useId();
	const offlineMessageChannelNameField = useId();
	const fallbackForwardDepartmentField = useId();
	const requestTagBeforeClosingChatField = useId();
	const chatClosingTagsField = useId();
	const allowReceiveForwardOffline = useId();
	const unitFieldId = useId();
	const agentsLabelId = useId();

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
									{...register('name', { required: t('Required_field', { field: t('Name') }) })}
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
										required: t('Required_field', { field: t('Email') }),
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

								<Field>
									<FieldLabel htmlFor={unitFieldId} required={isUnitRequired}>
										{t('Unit')}
									</FieldLabel>
									<FieldRow>
										<Controller
											name='unit'
											control={control}
											rules={{ required: isUnitRequired ? t('Required_field', { field: t('Unit') }) : false }}
											render={({ field: { value, onChange } }) => (
												<AutoCompleteUnit
													disabled={!!initialValues.unit}
													haveNone
													id={unitFieldId}
													error={errors.unit?.message as string}
													aria-describedby={`${unitFieldId}-error`}
													value={value}
													onChange={onChange}
													onLoadItems={(list) => {
														// NOTE: list.itemCount > 1 to account for the "None" option
														setUnitRequired(!canManageUnits && list.itemCount > 1);
													}}
												/>
											)}
										/>
									</FieldRow>
									{errors.unit && (
										<FieldError aria-live='assertive' id={`${unitFieldId}-error`}>
											{errors.unit?.message}
										</FieldError>
									)}
								</Field>
							</>
						)}

						<Field>
							<FieldRow>
								<FieldLabel htmlFor={requestTagBeforeClosingChatField}>{t('Request_tag_before_closing_chat')}</FieldLabel>
								<ToggleSwitch id={requestTagBeforeClosingChatField} {...register('requestTagBeforeClosingChat')} />
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
									rules={{ required: t('Required_field', 'tags') }}
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
							<FieldRow>
								<FieldLabel htmlFor={allowReceiveForwardOffline}>{t('Accept_receive_inquiry_no_online_agents')}</FieldLabel>
								<ToggleSwitch id={allowReceiveForwardOffline} {...register('allowReceiveForwardOffline')} />
							</FieldRow>
							<FieldRow>
								<FieldHint id={`${allowReceiveForwardOffline}-hint`}>{t('Accept_receive_inquiry_no_online_agents_Hint')}</FieldHint>
							</FieldRow>
						</Field>
						<Field>
							<DepartmentBusinessHours bhId={department?.businessHourId} />
						</Field>

						<Divider mb={16} />

						<Field>
							<FieldLabel id={agentsLabelId} mb={4}>
								{t('Agents')}
							</FieldLabel>
							<Box display='flex' flexDirection='column' height='50vh'>
								<DepartmentsAgentsTable aria-labelledby={agentsLabelId} control={control} register={register} />
							</Box>
						</Field>
					</FieldGroup>
				</PageScrollableContentWithShadow>
			</Page>
		</Page>
	);
}

export default EditDepartment;
