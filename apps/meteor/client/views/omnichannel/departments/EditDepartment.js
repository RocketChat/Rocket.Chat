import {
	FieldGroup,
	Field,
	TextInput,
	Chip,
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
import React, { useMemo, useState, useRef, useCallback } from 'react';

import { validateEmail } from '../../../../lib/emailValidator';
import Page from '../../../components/Page';
import { useRoomsList } from '../../../components/RoomAutoComplete/hooks/useRoomsList';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { useForm } from '../../../hooks/useForm';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { useFormsSubscription } from '../additionalForms';
import DepartmentsAgentsTable from './DepartmentsAgentsTable';

function withDefault(key, defaultValue) {
	return key || defaultValue;
}

function EditDepartment({ data, id, title, reload, allowedToForwardData }) {
	const t = useTranslation();
	const departmentsRoute = useRoute('omnichannel-departments');

	const {
		useEeNumberInput = () => {},
		useEeTextInput = () => {},
		useEeTextAreaInput = () => {},
		useDepartmentForwarding = () => {},
		useDepartmentBusinessHours = () => {},
		useSelectForwardDepartment = () => {},
	} = useFormsSubscription();

	const initialAgents = useRef((data && data.agents) || []);

	const MaxChats = useEeNumberInput();
	const VisitorInactivity = useEeNumberInput();
	const WaitingQueueMessageInput = useEeTextAreaInput();
	const AbandonedMessageInput = useEeTextInput();
	const DepartmentForwarding = useDepartmentForwarding();
	const DepartmentBusinessHours = useDepartmentBusinessHours();
	const AutoCompleteDepartment = useSelectForwardDepartment();
	const [agentList, setAgentList] = useState([]);
	const [agentsRemoved, setAgentsRemoved] = useState([]);
	const [agentsAdded, setAgentsAdded] = useState([]);

	const { department } = data || { department: {} };

	const [initialTags] = useState(() => department?.chatClosingTags ?? []);
	const [[tags, tagsText], setTagsState] = useState(() => [initialTags, '']);
	const hasTagChanges = useMemo(() => tags.toString() !== initialTags.toString(), [tags, initialTags]);

	const { values, handlers, hasUnsavedChanges } = useForm({
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
	});
	const {
		handleName,
		handleEmail,
		handleDescription,
		handleEnabled,
		handleMaxNumberSimultaneousChat,
		handleShowOnRegistration,
		handleShowOnOfflineForm,
		handleAbandonedRoomsCloseCustomMessage,
		handleRequestTagBeforeClosingChat,
		handleOfflineMessageChannelName,
		handleVisitorInactivityTimeoutInSeconds,
		handleWaitingQueueMessage,
		handleDepartmentsAllowedToForward,
		handleFallbackForwardDepartment,
	} = handlers;

	const {
		name,
		email,
		description,
		enabled,
		maxNumberSimultaneousChat,
		showOnRegistration,
		showOnOfflineForm,
		abandonedRoomsCloseCustomMessage,
		requestTagBeforeClosingChat,
		offlineMessageChannelName,
		visitorInactivityTimeoutInSeconds,
		waitingQueueMessage,
		departmentsAllowedToForward,
		fallbackForwardDepartment,
	} = values;

	const { itemsList: RoomsList, loadMoreItems: loadMoreRooms } = useRoomsList(
		useMemo(() => ({ text: offlineMessageChannelName }), [offlineMessageChannelName]),
	);

	const { phase: roomsPhase, items: roomsItems, itemCount: roomsTotal } = useRecordList(RoomsList);

	const handleTagChipClick = (tag) => () => {
		setTagsState(([tags, tagsText]) => [tags.filter((_tag) => _tag !== tag), tagsText]);
	};

	const handleTagTextSubmit = useCallback(() => {
		setTagsState((state) => {
			const [tags, tagsText] = state;

			if (tags.includes(tagsText)) {
				return state;
			}

			return [[...tags, tagsText], ''];
		});
	}, []);

	const handleTagTextChange = (e) => {
		setTagsState(([tags]) => [tags, e.target.value]);
	};

	const saveDepartmentInfo = useMethod('livechat:saveDepartment');
	const saveDepartmentAgentsInfoOnEdit = useEndpoint('POST', `/v1/livechat/department/${id}/agents`);

	const dispatchToastMessage = useToastMessageDispatch();

	const [nameError, setNameError] = useState();
	const [emailError, setEmailError] = useState();
	const [tagError, setTagError] = useState();

	useComponentDidUpdate(() => {
		setNameError(!name ? t('The_field_is_required', 'name') : '');
	}, [t, name]);
	useComponentDidUpdate(() => {
		setEmailError(!email ? t('The_field_is_required', 'email') : '');
	}, [t, email]);
	useComponentDidUpdate(() => {
		setEmailError(!validateEmail(email) ? t('Validate_email_address') : '');
	}, [t, email]);
	useComponentDidUpdate(() => {
		setTagError(requestTagBeforeClosingChat && (!tags || tags.length === 0) ? t('The_field_is_required', 'name') : '');
	}, [requestTagBeforeClosingChat, t, tags]);

	const handleSubmit = useMutableCallback(async (e) => {
		e.preventDefault();
		let error = false;
		if (!name) {
			setNameError(t('The_field_is_required', 'name'));
			error = true;
		}
		if (!email) {
			setEmailError(t('The_field_is_required', 'email'));
			error = true;
		}
		if (!validateEmail(email)) {
			setEmailError(t('Validate_email_address'));
			error = true;
		}
		if (requestTagBeforeClosingChat && (!tags || tags.length === 0)) {
			setTagError(t('The_field_is_required', 'tags'));
			error = true;
		}

		if (error) {
			return;
		}

		const payload = {
			enabled,
			name,
			description,
			showOnRegistration,
			showOnOfflineForm,
			requestTagBeforeClosingChat,
			email,
			chatClosingTags: tags,
			offlineMessageChannelName,
			maxNumberSimultaneousChat,
			visitorInactivityTimeoutInSeconds,
			abandonedRoomsCloseCustomMessage,
			waitingQueueMessage,
			departmentsAllowedToForward: departmentsAllowedToForward?.map((dep) => dep.value).join(),
			fallbackForwardDepartment: fallbackForwardDepartment.value,
		};

		const agentListPayload = {
			upsert: agentList.filter(
				(agent) =>
					!initialAgents.current.some(
						(initialAgent) => initialAgent._id === agent._id && agent.count === initialAgent.count && agent.order === initialAgent.order,
					),
			),
			remove: initialAgents.current.filter((initialAgent) => !agentList.some((agent) => initialAgent._id === agent._id)),
		};

		try {
			if (id) {
				await saveDepartmentInfo(id, payload, []);
				if (agentListPayload.upsert.length > 0 || agentListPayload.remove.length > 0) {
					await saveDepartmentAgentsInfoOnEdit(agentListPayload);
				}
			} else {
				await saveDepartmentInfo(id, payload, agentList);
			}
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload();
			departmentsRoute.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleReturn = useMutableCallback(() => {
		departmentsRoute.push({});
	});

	const invalidForm =
		!name ||
		!email ||
		!validateEmail(email) ||
		!(hasUnsavedChanges || hasTagChanges) ||
		(requestTagBeforeClosingChat && (!tags || tags.length === 0));

	const formId = useUniqueId();

	const hasNewAgent = useMemo(() => data.agents.length === agentList.length, [data.agents, agentList]);

	const agentsHaveChanged = () => {
		let hasChanges = false;
		if (agentList.length !== initialAgents.current.length) {
			hasChanges = true;
		}

		if (agentsAdded.length > 0 && agentsRemoved.length > 0) {
			hasChanges = true;
		}

		agentList.forEach((agent) => {
			const existingAgent = initialAgents.current.find((initial) => initial.agentId === agent.agentId);
			if (existingAgent) {
				if (agent.count !== existingAgent.count) {
					hasChanges = true;
				}
				if (agent.order !== existingAgent.order) {
					hasChanges = true;
				}
			}
		});

		return hasChanges;
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={title}>
					<ButtonGroup>
						<Button onClick={handleReturn}>
							<Icon name='back' /> {t('Back')}
						</Button>
						<Button type='submit' form={formId} primary disabled={invalidForm && hasNewAgent && !(id && agentsHaveChanged())}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.ScrollableContentWithShadow>
					<FieldGroup w='full' alignSelf='center' maxWidth='x600' id={formId} is='form' autoComplete='off' onSubmit={handleSubmit}>
						<Field>
							<Box display='flex' data-qa='DepartmentEditToggle-Enabled' flexDirection='row'>
								<Field.Label>{t('Enabled')}</Field.Label>
								<Field.Row>
									<ToggleSwitch flexGrow={1} checked={enabled} onChange={handleEnabled} />
								</Field.Row>
							</Box>
						</Field>
						<Field>
							<Field.Label>{t('Name')}*</Field.Label>
							<Field.Row>
								<TextInput
									data-qa='DepartmentEditTextInput-Name'
									flexGrow={1}
									error={nameError}
									value={name}
									onChange={handleName}
									placeholder={t('Name')}
								/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Description')}</Field.Label>
							<Field.Row>
								<TextAreaInput
									data-qa='DepartmentEditTextInput-Description'
									flexGrow={1}
									value={description}
									onChange={handleDescription}
									placeholder={t('Description')}
								/>
							</Field.Row>
						</Field>
						<Field>
							<Box data-qa='DepartmentEditToggle-ShowOnRegistrationPage' display='flex' flexDirection='row'>
								<Field.Label>{t('Show_on_registration_page')}</Field.Label>
								<Field.Row>
									<ToggleSwitch flexGrow={1} checked={showOnRegistration} onChange={handleShowOnRegistration} />
								</Field.Row>
							</Box>
						</Field>
						<Field>
							<Field.Label>{t('Email')}*</Field.Label>
							<Field.Row>
								<TextInput
									data-qa='DepartmentEditTextInput-Email'
									flexGrow={1}
									error={emailError}
									value={email}
									addon={<Icon name='mail' size='x20' />}
									onChange={handleEmail}
									placeholder={t('Email')}
								/>
							</Field.Row>
						</Field>
						<Field>
							<Box display='flex' data-qa='DepartmentEditToggle-ShowOnOfflinePage' flexDirection='row'>
								<Field.Label>{t('Show_on_offline_page')}</Field.Label>
								<Field.Row>
									<ToggleSwitch flexGrow={1} checked={showOnOfflineForm} onChange={handleShowOnOfflineForm} />
								</Field.Row>
							</Box>
						</Field>
						<Field>
							<Field.Label>{t('Livechat_DepartmentOfflineMessageToChannel')}</Field.Label>
							<Field.Row>
								<PaginatedSelectFiltered
									data-qa='DepartmentSelect-LivechatDepartmentOfflineMessageToChannel'
									value={offlineMessageChannelName}
									onChange={handleOfflineMessageChannelName}
									flexShrink={0}
									filter={offlineMessageChannelName}
									setFilter={handleOfflineMessageChannelName}
									options={roomsItems}
									placeholder={t('Channel_name')}
									endReached={roomsPhase === AsyncStatePhase.LOADING ? () => {} : (start) => loadMoreRooms(start, Math.min(50, roomsTotal))}
								/>
							</Field.Row>
						</Field>
						{MaxChats && (
							<Field>
								<MaxChats
									value={maxNumberSimultaneousChat}
									handler={handleMaxNumberSimultaneousChat}
									label={'Max_number_of_chats_per_agent'}
									placeholder='Max_number_of_chats_per_agent_description'
								/>
							</Field>
						)}
						{VisitorInactivity && (
							<Field>
								<VisitorInactivity
									value={visitorInactivityTimeoutInSeconds}
									handler={handleVisitorInactivityTimeoutInSeconds}
									label={'How_long_to_wait_to_consider_visitor_abandonment_in_seconds'}
									placeholder='Number_in_seconds'
								/>
							</Field>
						)}
						{AbandonedMessageInput && (
							<Field>
								<AbandonedMessageInput
									value={abandonedRoomsCloseCustomMessage}
									handler={handleAbandonedRoomsCloseCustomMessage}
									label={'Livechat_abandoned_rooms_closed_custom_message'}
									placeholder='Enter_a_custom_message'
								/>
							</Field>
						)}
						{WaitingQueueMessageInput && (
							<Field>
								<WaitingQueueMessageInput value={waitingQueueMessage} handler={handleWaitingQueueMessage} label={'Waiting_queue_message'} />
							</Field>
						)}
						{DepartmentForwarding && (
							<Field>
								<DepartmentForwarding
									departmentId={id}
									value={departmentsAllowedToForward}
									handler={handleDepartmentsAllowedToForward}
									label={'List_of_departments_for_forward'}
									placeholder='Enter_a_department_name'
								/>
							</Field>
						)}
						{AutoCompleteDepartment && (
							<Field>
								<Field.Label>{t('Fallback_forward_department')}</Field.Label>
								<AutoCompleteDepartment
									haveNone
									excludeDepartmentId={department?._id}
									value={fallbackForwardDepartment}
									onChange={handleFallbackForwardDepartment}
									placeholder={t('Fallback_forward_department')}
									label={t('Fallback_forward_department')}
									onlyMyDepartments
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
										checked={requestTagBeforeClosingChat}
										onChange={handleRequestTagBeforeClosingChat}
									/>
								</Field.Row>
							</Box>
						</Field>
						{requestTagBeforeClosingChat && (
							<Field>
								<Field.Label alignSelf='stretch'>{t('Conversation_closing_tags')}*</Field.Label>
								<Field.Row>
									<TextInput
										data-qa='DepartmentEditTextInput-ConversationClosingTags'
										error={tagError}
										value={tagsText}
										onChange={handleTagTextChange}
										placeholder={t('Enter_a_tag')}
									/>
									<Button
										disabled={Boolean(!tagsText.trim()) || tags.includes(tagsText)}
										data-qa='DepartmentEditAddButton-ConversationClosingTags'
										mis='x8'
										title={t('add')}
										onClick={handleTagTextSubmit}
									>
										{t('Add')}
									</Button>
								</Field.Row>
								<Field.Hint>{t('Conversation_closing_tags_description')}</Field.Hint>
								{tags?.length > 0 && (
									<Field.Row justifyContent='flex-start'>
										{tags.map((tag, i) => (
											<Chip key={i} onClick={handleTagChipClick(tag)} mie='x8'>
												{tag}
											</Chip>
										))}
									</Field.Row>
								)}
							</Field>
						)}
						{DepartmentBusinessHours && (
							<Field>
								<DepartmentBusinessHours bhId={department?.businessHourId} />
							</Field>
						)}
						<Divider mb='x16' />
						<Field>
							<Field.Label mb='x4'>{t('Agents')}:</Field.Label>
							<Box display='flex' flexDirection='column' height='50vh'>
								<DepartmentsAgentsTable
									agents={data && data.agents}
									setAgentListFinal={setAgentList}
									setAgentsAdded={setAgentsAdded}
									setAgentsRemoved={setAgentsRemoved}
								/>
							</Box>
						</Field>
					</FieldGroup>
				</Page.ScrollableContentWithShadow>
			</Page>
		</Page>
	);
}

export default EditDepartment;
