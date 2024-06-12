import { Box, Margins, Tag, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useUserSubscription, useTranslation, usePermission } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';

import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../../../components/Contextualbar';
import InfoPanel from '../../../../../components/InfoPanel';
import MarkdownText from '../../../../../components/MarkdownText';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { useFormatDuration } from '../../../../../hooks/useFormatDuration';
import CustomField from '../../../components/CustomField';
import { AgentField, SlaField, ContactField, SourceField } from '../../components';
import PriorityField from '../../components/PriorityField';
import { useOmnichannelRoomInfo } from '../../hooks/useOmnichannelRoomInfo';
import { formatQueuedAt } from '../../utils/formatQueuedAt';
import DepartmentField from './DepartmentField';
import VisitorClientInfo from './VisitorClientInfo';

// TODO: Remove moment we are mixing moment and our own formatters :sadface:
function ChatInfo({ id, route }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const formatDateAndTime = useFormatDateAndTime();
	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('/v1/livechat/custom-fields');
	const [customFields, setCustomFields] = useState([]);
	const formatDuration = useFormatDuration();

	const { data: room } = useOmnichannelRoomInfo(id);

	const {
		ts,
		tags,
		closedAt,
		departmentId,
		v,
		servedBy,
		metrics,
		topic,
		waitingResponse,
		responseBy,
		slaId,
		priorityId,
		livechatData,
		source,
		queuedAt,
	} = room || { room: { v: {} } };

	const routePath = useRoute(route || 'omnichannel-directory');
	const canViewCustomFields = usePermission('view-livechat-room-customfields');
	const subscription = useUserSubscription(id);
	const hasGlobalEditRoomPermission = usePermission('save-others-livechat-room-info');
	const hasLocalEditRoomPermission = servedBy?._id === Meteor.userId();
	const visitorId = v?._id;
	const queueStartedAt = queuedAt || ts;

	const queueTime = useMemo(() => formatQueuedAt(room), [room]);

	useEffect(() => {
		if (allCustomFields) {
			const { customFields: customFieldsAPI } = allCustomFields;
			setCustomFields(customFieldsAPI);
		}
	}, [allCustomFields, stateCustomFields]);

	const checkIsVisibleAndScopeRoom = (key) => {
		const field = customFields.find(({ _id }) => _id === key);
		return field?.visibility === 'visible' && field?.scope === 'room';
	};

	const onEditClick = useMutableCallback(() => {
		const hasEditAccess = !!subscription || hasLocalEditRoomPermission || hasGlobalEditRoomPermission;
		if (!hasEditAccess) {
			return dispatchToastMessage({ type: 'error', message: t('Not_authorized') });
		}

		routePath.push(
			route
				? {
						tab: 'room-info',
						context: 'edit',
						id,
				  }
				: {
						page: 'chats',
						id,
						bar: 'edit',
				  },
		);
	});

	const customFieldEntries = Object.entries(livechatData || {}).filter(([key]) => checkIsVisibleAndScopeRoom(key) && livechatData[key]);

	return (
		<>
			<ContextualbarScrollableContent p={24}>
				<Margins block='x4'>
					{source && <SourceField room={room} />}
					{room && v && <ContactField contact={v} room={room} />}
					{visitorId && <VisitorClientInfo uid={visitorId} />}
					{servedBy && <AgentField agent={servedBy} />}
					{departmentId && <DepartmentField departmentId={departmentId} />}
					{tags && tags.length > 0 && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Tags')}</InfoPanel.Label>
							<InfoPanel.Text>
								{tags.map((tag) => (
									<Box key={tag} mie={4} display='inline'>
										<Tag style={{ display: 'inline' }} disabled>
											{tag}
										</Tag>
									</Box>
								))}
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{topic && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Topic')}</InfoPanel.Label>
							<InfoPanel.Text withTruncatedText={false}>
								<MarkdownText variant='inline' content={topic} />
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{queueStartedAt && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Queue_Time')}</InfoPanel.Label>
							<InfoPanel.Text>{queueTime}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{closedAt && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Chat_Duration')}</InfoPanel.Label>
							<InfoPanel.Text>{moment(closedAt).from(moment(ts), true)}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{ts && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Created_at')}</InfoPanel.Label>
							<InfoPanel.Text>{formatDateAndTime(ts)}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{closedAt && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Closed_At')}</InfoPanel.Label>
							<InfoPanel.Text>{formatDateAndTime(closedAt)}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{servedBy?.ts && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Taken_at')}</InfoPanel.Label>
							<InfoPanel.Text>{formatDateAndTime(servedBy.ts)}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{metrics?.response?.avg && formatDuration(metrics.response.avg) && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Avg_response_time')}</InfoPanel.Label>
							<InfoPanel.Text>{formatDuration(metrics.response.avg)}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{!waitingResponse && responseBy?.lastMessageTs && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Inactivity_Time')}</InfoPanel.Label>
							<InfoPanel.Text>{moment(responseBy.lastMessageTs).fromNow(true)}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{canViewCustomFields && customFieldEntries.map(([key, value]) => <CustomField key={key} id={key} value={value} />)}
					{slaId && <SlaField id={slaId} />}
					{priorityId && <PriorityField id={priorityId} />}
				</Margins>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button icon='pencil' onClick={onEditClick} data-qa-id='room-info-edit'>
						{t('Edit')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
}

export default ChatInfo;
