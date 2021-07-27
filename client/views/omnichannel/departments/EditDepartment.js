/* eslint-disable complexity */
import {
	FieldGroup,
	Field,
	TextInput,
	Chip,
	SelectFiltered,
	Box,
	Icon,
	Divider,
	ToggleSwitch,
	TextAreaInput,
	ButtonGroup,
	Button,
} from '@rocket.chat/fuselage';
import { useMutableCallback, useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState, useRef } from 'react';
import { useSubscription } from 'use-subscription';

import { isEmail } from '../../../../app/utils/client';
import Page from '../../../components/Page';
import { useRoute } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { useForm } from '../../../hooks/useForm';
import { formsSubscription } from '../additionalForms';
import DepartmentsAgentsTable from './DepartmentsAgentsTable';

const useQuery = ({ name }) => useMemo(() => ({ selector: JSON.stringify({ name }) }), [name]);

function EditDepartment({ data, id, title, reload, allowedToForwardData }) {
	const t = useTranslation();
	const agentsRoute = useRoute('omnichannel-departments');
	const eeForms = useSubscription(formsSubscription);
	const initialAgents = useRef((data && data.agents) || []);

	const router = useRoute('omnichannel-departments');

	const {
		useEeNumberInput = () => {},
		useEeTextInput = () => {},
		useEeTextAreaInput = () => {},
		useDepartmentForwarding = () => {},
		useDepartmentBusinessHours = () => {},
	} = eeForms;

	const MaxChats = useEeNumberInput();
	const VisitorInactivity = useEeNumberInput();
	const WaitingQueueMessageInput = useEeTextAreaInput();
	const AbandonedMessageInput = useEeTextInput();
	const DepartmentForwarding = useDepartmentForwarding();
	const DepartmentBusinessHours = useDepartmentBusinessHours();
	const [agentList, setAgentList] = useState([]);

	const { department } = data || { department: {} };

	const [tags, setTags] = useState((department && department.chatClosingTags) || []);
	const [tagsText, setTagsText] = useState();

	const { values, handlers, hasUnsavedChanges } = useForm({
		name: (department && department.name) || '',
		email: (department && department.email) || '',
		description: (department && department.description) || '',
		enabled: !!(department && department.enabled),
		maxNumberSimultaneousChat: (department && department.maxNumberSimultaneousChat) || undefined,
		showOnRegistration: !!(department && department.showOnRegistration),
		showOnOfflineForm: !!(department && department.showOnOfflineForm),
		abandonedRoomsCloseCustomMessage:
			(department && department.abandonedRoomsCloseCustomMessage) || '',
		requestTagBeforeClosingChat: (department && department.requestTagBeforeClosingChat) || false,
		offlineMessageChannelName: (department && department.offlineMessageChannelName) || '',
		visitorInactivityTimeoutInSeconds:
			(department && department.visitorInactivityTimeoutInSeconds) || undefined,
		waitingQueueMessage: (department && department.waitingQueueMessage) || '',
		departmentsAllowedToForward:
			(allowedToForwardData &&
				allowedToForwardData.departments &&
				allowedToForwardData.departments.map((dep) => ({ label: dep.name, value: dep._id }))) ||
			[],
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
	} = values;

	const handleTagChipClick = (tag) => () => {
		setTags((tags) => tags.filter((_tag) => _tag !== tag));
	};

	const handleTagTextSubmit = useMutableCallback(() => {
		if (!tags.includes(tagsText)) {
			setTags([...tags, tagsText]);
			setTagsText('');
		}
	});

	const handleTagTextChange = useMutableCallback((e) => {
		setTagsText(e.target.value);
	});

	const query = useQuery({ offlineMessageChannelName });

	const { value: autoCompleteChannels = {} } = useEndpointData(
		'rooms.autocomplete.channelAndPrivate',
		query,
	);

	const channelOpts = useMemo(
		() =>
			autoCompleteChannels && autoCompleteChannels.items
				? autoCompleteChannels.items.map(({ name }) => [name, name])
				: [],
		[autoCompleteChannels],
	);

	const saveDepartmentInfo = useMethod('livechat:saveDepartment');
	const saveDepartmentAgentsInfoOnEdit = useEndpointAction(
		'POST',
		`livechat/department/${id}/agents`,
	);

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
		setEmailError(!isEmail(email) ? t('Validate_email_address') : '');
	}, [t, email]);
	useComponentDidUpdate(() => {
		setTagError(
			requestTagBeforeClosingChat && (!tags || tags.length === 0)
				? t('The_field_is_required', 'name')
				: '',
		);
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
		if (!isEmail(email)) {
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
			departmentsAllowedToForward:
				departmentsAllowedToForward && departmentsAllowedToForward.map((dep) => dep.value).join(),
		};

		const agentListPayload = {
			upsert: agentList.filter(
				(agent) =>
					!initialAgents.current.some(
						(initialAgent) =>
							initialAgent._id === agent._id &&
							agent.count === initialAgent.count &&
							agent.order === initialAgent.order,
					),
			),
			remove: initialAgents.current.filter(
				(initialAgent) => !agentList.some((agent) => initialAgent._id === agent._id),
			),
		};

		try {
			if (id) {
				await saveDepartmentInfo(id, payload, []);
				await saveDepartmentAgentsInfoOnEdit(agentListPayload);
			} else {
				await saveDepartmentInfo(id, payload, agentList);
			}
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload();
			agentsRoute.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleReturn = useMutableCallback(() => {
		router.push({});
	});

	const invalidForm =
		!name ||
		!email ||
		!isEmail(email) ||
		!hasUnsavedChanges ||
		(requestTagBeforeClosingChat && (!tags || tags.length === 0));

	const formId = useUniqueId();

	const hasNewAgent = useMemo(
		() => data.agents.length === agentList.length,
		[data.agents, agentList],
	);

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={title}>
					<ButtonGroup>
						<Button onClick={handleReturn}>
							<Icon name='back' /> {t('Back')}
						</Button>
						<Button type='submit' form={formId} primary disabled={invalidForm && hasNewAgent}>
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
						onSubmit={handleSubmit}
					>
						<Field>
							<Box display='flex' flexDirection='row'>
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
									flexGrow={1}
									value={description}
									onChange={handleDescription}
									placeholder={t('Description')}
								/>
							</Field.Row>
						</Field>
						<Field>
							<Box display='flex' flexDirection='row'>
								<Field.Label>{t('Show_on_registration_page')}</Field.Label>
								<Field.Row>
									<ToggleSwitch
										flexGrow={1}
										checked={showOnRegistration}
										onChange={handleShowOnRegistration}
									/>
								</Field.Row>
							</Box>
						</Field>
						<Field>
							<Field.Label>{t('Email')}*</Field.Label>
							<Field.Row>
								<TextInput
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
							<Box display='flex' flexDirection='row'>
								<Field.Label>{t('Show_on_offline_page')}</Field.Label>
								<Field.Row>
									<ToggleSwitch
										flexGrow={1}
										checked={showOnOfflineForm}
										onChange={handleShowOnOfflineForm}
									/>
								</Field.Row>
							</Box>
						</Field>
						<Field>
							<Field.Label>{t('Livechat_DepartmentOfflineMessageToChannel')}</Field.Label>
							<Field.Row>
								<SelectFiltered
									flexGrow={1}
									options={channelOpts}
									value={offlineMessageChannelName}
									onChange={handleOfflineMessageChannelName}
									placeholder={t('Channel_name')}
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
								<WaitingQueueMessageInput
									value={waitingQueueMessage}
									handler={handleWaitingQueueMessage}
									label={'Waiting_queue_message'}
								/>
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
						<Field>
							<Box display='flex' flexDirection='row'>
								<Field.Label>{t('Request_tag_before_closing_chat')}</Field.Label>
								<Field.Row>
									<ToggleSwitch
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
										error={tagError}
										value={tagsText}
										onChange={handleTagTextChange}
										placeholder={t('Enter_a_tag')}
									/>
									<Button mis='x8' title={t('add')} onClick={handleTagTextSubmit}>
										{t('Add')}
									</Button>
								</Field.Row>
								<Field.Hint>{t('Conversation_closing_tags_description')}</Field.Hint>
								{tags && tags.length > 0 && (
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
								<DepartmentBusinessHours bhId={department && department.businessHourId} />
							</Field>
						)}
						<Divider mb='x16' />
						<Field>
							<Field.Label mb='x4'>{t('Agents')}:</Field.Label>
							<Box display='flex' flexDirection='column' height='50vh'>
								<DepartmentsAgentsTable
									agents={data && data.agents}
									setAgentListFinal={setAgentList}
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
