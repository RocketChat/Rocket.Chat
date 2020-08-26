import React, { useMemo, useRef, useState } from 'react';
import { Field, TextInput, NumberInput, SelectFiltered, Box, MultiSelect, Icon, Select, ToggleSwitch, TextAreaInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSubscription } from 'use-subscription';

import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from '../../components/basic/VerticalBar';
import { UserInfo } from '../../components/basic/UserInfo';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { FormSkeleton } from './Skeleton';
import { useForm } from '../../hooks/useForm';
import { getUserEmailAddress } from '../../helpers/getUserEmailAddress';
import { useRoute } from '../../contexts/RouterContext';
import { formsSubscription } from '../additionalForms';
import Page from '../../components/basic/Page';

export default function EditDepartmentWithData({ id, reload }) {
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

	return <EditDepartment id={id} data={data} reset={reload}/>;
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

export function EditDepartment({ data, userDepartments, availableDepartments, id, reload, title }) {
	const t = useTranslation();
	const agentsRoute = useRoute('omnichannel-departments');

	const { department } = data || { department: {} };

	const { values, handlers, hasUnsavedChanges } = useForm({
		name: department.name,
		email: department.email,
		description: department.description,
		enabled: department.enabled,
		maxNumberSimultaneousChat: department.maxNumberSimultaneousChat,
		showOnRegistration: department.showOnRegistration,
		showOnOfflineForm: department.showOnOfflineForm,
		abandonedRoomsCloseCustomMessage: department.abandonedRoomsCloseCustomMessage,
		chatClosingTags: department.chatClosingTags,
		numAgents: department.numAgents,
		requestTagBeforeClosingChat: department.requestTagBeforeClosingChat,
		offlineMessageChannelName: department.offlineMessageChannelName,
		visitorInactivityTimeoutInSeconds: department.visitorInactivityTimeoutInSeconds,
		waitingQueueMessage: department.waitingQueueMessage,
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
		handleChatClosingTags,
		handleNumAgents,
		handleRequestTagBeforeClosingChat,
		handleOfflineMessageChannelName,
		handleVisitorInactivityTimeoutInSeconds,
		handleWaitingQueueMessage,
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
		chatClosingTags,
		numAgents,
		requestTagBeforeClosingChat,
		offlineMessageChannelName,
		visitorInactivityTimeoutInSeconds,
		waitingQueueMessage,
	} = values;

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

	const channelOpts = useMemo(() => (autoCompleteChannels && autoCompleteChannels.items ? autoCompleteChannels.items.map(({ _id, name }) => [_id, name || _id]) : []), [autoCompleteChannels]);

	console.log(channelOpts);

	const saveAgentInfo = useMethod('livechat:saveDepartment');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleSave = useMutableCallback(async () => {
		try {
			await saveAgentInfo(id);
			dispatchToastMessage({ type: 'success', message: t('saved') });
			agentsRoute.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			console.log(error);
		}
	});

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={title}/>
			<Page.ScrollableContentWithShadow>
				<Field>
					<Field.Label>{t('Enabled')}</Field.Label>
					<Field.Row>
						<ToggleSwitch flexGrow={1} value={enabled} onChange={handleEnabled} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Name')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} checked={name} onChange={handleName} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput flexGrow={1} value={description} onChange={handleDescription} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Show_on_registration_page')}</Field.Label>
					<Field.Row>
						<ToggleSwitch flexGrow={1} checked={showOnRegistration} onChange={handleShowOnRegistration} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Email')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} value={email} addon={<Icon name='mail' size='x20'/>} onChange={handleEmail}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Show_on_offline_page')}</Field.Label>
					<Field.Row>
						<ToggleSwitch flexGrow={1} checked={showOnOfflineForm} onChange={handleShowOnOfflineForm} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Livechat_DepartmentOfflineMessageToChannel')}</Field.Label>
					<Field.Row>
						<SelectFiltered flexGrow={1} options={channelOpts} value={offlineMessageChannelName} onChange={handleOfflineMessageChannelName} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Max_number_of_chats_per_agent')}</Field.Label>
					<Field.Row>
						<NumberInput flexGrow={1} checked={maxNumberSimultaneousChat} onChange={handleMaxNumberSimultaneousChat} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('How_long_to_wait_to_consider_visitor_abandonment_in_seconds')}</Field.Label>
					<Field.Row>
						<NumberInput flexGrow={1} value={visitorInactivityTimeoutInSeconds} onChange={handleVisitorInactivityTimeoutInSeconds} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Waiting_queue_message')}</Field.Label>
					<Field.Row>
						<TextAreaInput flexGrow={1} value={waitingQueueMessage} onChange={handleWaitingQueueMessage} />
					</Field.Row>
				</Field>
			</Page.ScrollableContentWithShadow>
		</Page>
	</Page>;
}


