/* eslint-disable complexity */
import React, { useMemo, useState } from 'react';
import { Field, TextInput, Chip, SelectFiltered, Box, Icon, Divider, ToggleSwitch, TextAreaInput, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSubscription } from 'use-subscription';

import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { FormSkeleton } from './Skeleton';
import { useForm } from '../../hooks/useForm';
import { useRoute } from '../../contexts/RouterContext';
import Page from '../../components/basic/Page';
import DepartmentsAgentsTable from './DepartmentsAgentsTable';
import { formsSubscription } from '../additionalForms';


export default function EditDepartmentWithData({ id, reload, title }) {
	const t = useTranslation();
	const { data, state, error } = useEndpointDataExperimental(`livechat/department/${ id }`) || {};
	// const { data: userDepartments, state: userDepartmentsState, error: userDepartmentsError } = useEndpointDataExperimental(`livechat/agents/${ id }/departments`);
	// const { data: availableDepartments, state: availableDepartmentsState, error: availableDepartmentsError } = useEndpointDataExperimental('livechat/department');

	if ([state].includes(ENDPOINT_STATES.LOADING)) {
		return <FormSkeleton/>;
	}

	if (error) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}
	console.log(data);
	return <EditDepartment id={id} data={data} reset={reload} title={title}/>;
}

// abandonedRoomsCloseCustomMessage: "fuk u"
// chatClosingTags: ["asd"]
// departmentsAllowedToForward: ""
// description: "Binus is gud"
// email: "asd@asd.com"
// enabled: true
// maxNumberSimultaneousChat: "3"
// name: "binus"
// numAgents: 2
// offlineMessageChannelName: ""
// requestTagBeforeClosingChat: false
// showOnOfflineForm: true
// showOnRegistration: true
// visitorInactivityTimeoutInSeconds: "12"
// waitingQueueMessage: "Wait for binus"
// _id: "xmF2DLvaLfgorggK5"
// _updatedAt: "2020-08-24T21:22:38.276Z"

// rooms.autocomplete.channelAndPrivate

const useQuery = ({ name }) => useMemo(() => ({ selector: JSON.stringify({ name }) }), [name]);

export function EditDepartment({ data, id, title }) {
	const t = useTranslation();
	const agentsRoute = useRoute('omnichannel-departments');
	const eeForms = useSubscription(formsSubscription);

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

	console.log(data);

	const { values, handlers } = useForm({
		name: (department && department.name) || '',
		email: (department && department.email) || '',
		description: (department && department.description) || '',
		enabled: (department && department.enabled) || true,
		maxNumberSimultaneousChat: (department && department.maxNumberSimultaneousChat) || undefined,
		showOnRegistration: (department && department.showOnRegistration) || true,
		showOnOfflineForm: (department && department.showOnOfflineForm) || true,
		abandonedRoomsCloseCustomMessage: (department && department.abandonedRoomsCloseCustomMessage) || '',
		requestTagBeforeClosingChat: (department && department.requestTagBeforeClosingChat) || false,
		offlineMessageChannelName: (department && department.offlineMessageChannelName) || '',
		visitorInactivityTimeoutInSeconds: (department && department.visitorInactivityTimeoutInSeconds) || undefined,
		waitingQueueMessage: (department && department.waitingQueueMessage) || '',
		departmentsAllowedToForward: (department && department.departmentsAllowedToForward) || [],
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
	// const defaultValidations = {
	// 	enabled: Boolean,
	// 	name: String,
	// 	description: Match.Optional(String),
	// 	showOnRegistration: Boolean,
	// 	email: String,
	// 	showOnOfflineForm: Boolean,
	// 	requestTagBeforeClosingChat: Match.Optional(Boolean),
	// 	chatClosingTags: Match.Optional([String]),
	// };

	// // The Livechat Form department support addition/custom fields, so those fields need to be added before validating
	// Object.keys(departmentData).forEach((field) => {
	// 	if (!defaultValidations.hasOwnProperty(field)) {
	// 		defaultValidations[field] = Match.OneOf(String, Match.Integer, Boolean);
	// 	}
	// });

	// check(departmentData, defaultValidations);
	// check(departmentAgents, Match.Maybe({
	// 	upsert: Match.Maybe(Array),
	// 	remove: Match.Maybe(Array),
	// }));

	const query = useQuery({ offlineMessageChannelName });

	const { data: autoCompleteChannels } = useEndpointDataExperimental('rooms.autocomplete.channelAndPrivate', query) || {};

	const channelOpts = useMemo(() => (autoCompleteChannels && autoCompleteChannels.items ? autoCompleteChannels.items.map(({ name }) => [name, name]) : []), [autoCompleteChannels]);

	console.log(channelOpts);

	const saveDepartmentInfo = useMethod('livechat:saveDepartment');

	const dispatchToastMessage = useToastMessageDispatch();

	// enabled: true,
	// name: 'asdasdasdasdasd',
	// description: 'asdsdasdad',
	// showOnRegistration: true,
	// showOnOfflineForm: true,
	// requestTagBeforeClosingChat: true,
	// email: 'asdadss@gmail.com',
	// chatClosingTags: [ 'pinus' ],
	// offlineMessageChannelName: 'general',
	// maxNumberSimultaneousChat: '10',
	// visitorInactivityTimeoutInSeconds: '20',
	// abandonedRoomsCloseCustomMessage: 'fuk u',
	// waitingQueueMessage: 'fuk me',
	// departmentsAllowedToForward: 'inNc2tPHTbyBo2dmt,8rbimWYR4HLLqii3t'

	const nameError = useMemo(() => (!name || name.length === 0 ? t('The_field_is_required', 'name') : undefined), [name, t]);
	const emailError = useMemo(() => (!email || email.length === 0 ? t('The_field_is_required', 'email') : undefined), [email, t]);
	const tagError = useMemo(() => ((requestTagBeforeClosingChat && !tags) || (requestTagBeforeClosingChat && tags.length === 0) ? t('The_field_is_required', 'tags') : undefined), [tags, t]);


	const handleSave = useMutableCallback(async () => {
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
			departmentsAllowedToForward: departmentsAllowedToForward && departmentsAllowedToForward[0],
		};
		console.log(agentList);
		try {
			await saveDepartmentInfo(id, payload, agentList);
			dispatchToastMessage({ type: 'success', message: t('saved') });
			agentsRoute.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			console.log(error);
		}
	});

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={title}>
				<ButtonGroup>
					<Button primary disabled={nameError || emailError || tagError} onClick={handleSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Field mbe='x16'>
					<Field.Label>{t('Enabled')}</Field.Label>
					<Field.Row>
						<ToggleSwitch flexGrow={1} checked={enabled} onChange={handleEnabled} />
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Name')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} error={nameError} value={name} onChange={handleName} placeholder={t('Name')} />
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput flexGrow={1} value={description} onChange={handleDescription} placeholder={t('Description')} />
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Show_on_registration_page')}</Field.Label>
					<Field.Row>
						<ToggleSwitch flexGrow={1} checked={showOnRegistration} onChange={handleShowOnRegistration} />
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Email')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} error={nameError} value={email} addon={<Icon name='mail' size='x20'/>} onChange={handleEmail} placeholder={t('Email')} />
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Show_on_offline_page')}</Field.Label>
					<Field.Row>
						<ToggleSwitch flexGrow={1} checked={showOnOfflineForm} onChange={handleShowOnOfflineForm} />
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Livechat_DepartmentOfflineMessageToChannel')}</Field.Label>
					<Field.Row>
						<SelectFiltered flexGrow={1} options={channelOpts} value={offlineMessageChannelName} onChange={handleOfflineMessageChannelName} placeholder={t('Channel_name')}/>
					</Field.Row>
				</Field>
				{MaxChats && <MaxChats value={maxNumberSimultaneousChat} handler={handleMaxNumberSimultaneousChat} label={'Max_number_of_chats_per_agent'} placeholder='Max_number_of_chats_per_agent_description' />}
				{VisitorInactivity && <VisitorInactivity value={visitorInactivityTimeoutInSeconds} handler={handleVisitorInactivityTimeoutInSeconds} label={'How_long_to_wait_to_consider_visitor_abandonment_in_seconds'} placeholder='Number_in_seconds' />}
				{AbandonedMessageInput && <AbandonedMessageInput value={abandonedRoomsCloseCustomMessage} handler={handleAbandonedRoomsCloseCustomMessage} label={'Livechat_abandoned_rooms_closed_custom_message'} placeholder='Enter_a_custom_message' />}
				{WaitingQueueMessageInput && <WaitingQueueMessageInput value={waitingQueueMessage} handler={handleWaitingQueueMessage} label={'Waiting_queue_message'} />}
				{DepartmentForwarding && <DepartmentForwarding value={departmentsAllowedToForward} handler={handleDepartmentsAllowedToForward} label={'List_of_departments_for_forward_description'} placeholder='Enter_a_department_name' />}
				<Field mbe='x16'>
					<Field.Label>{t('Request_tag_before_closing_chat')}</Field.Label>
					<Field.Row>
						<ToggleSwitch flexGrow={1} checked={requestTagBeforeClosingChat} onChange={handleRequestTagBeforeClosingChat} />
					</Field.Row>
				</Field>
				{requestTagBeforeClosingChat && <Field mbe='x16'>
					<Field.Label alignSelf='stretch'>{t('Conversation_closing_tags')}</Field.Label>
					<Field.Row>
						<TextInput error={tagError} value={tagsText} onChange={handleTagTextChange} placeholder={t('Enter_a_tag')} />
						<Button mis='x8' title={t('add')} onClick={handleTagTextSubmit}>
							{t('Add')}
						</Button>
					</Field.Row>
					<Field.Hint>{t('Conversation_closing_tags_description')}</Field.Hint>
					{tags && tags.length > 0 && <Field.Row justifyContent='flex-start'>
						{tags.map((tag, i) => <Chip key={i} onClick={handleTagChipClick(tag)} mie='x8'>{tag}</Chip>)}
					</Field.Row>}
				</Field>}
				{DepartmentBusinessHours && <DepartmentBusinessHours bhId={department && department.businessHourId}/>}
				<Divider mb='x16' />
				<Field mbe='x16'>
					<Field.Label mb='x4'>{t('Agents')}:</Field.Label>
					<DepartmentsAgentsTable agents={data && data.agents} setAgentListFinal={setAgentList}/>
				</Field>
			</Page.ScrollableContentWithShadow>
		</Page>
	</Page>;
}
