import { Box, Margins, Tag, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useUserSubscription, useTranslation } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';

import { hasPermission } from '../../../../../../app/authorization/client';
import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../../../components/Contextualbar';
import { InfoPanelField, InfoPanelLabel, InfoPanelText } from '../../../../../components/InfoPanel';
import MarkdownText from '../../../../../components/MarkdownText';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { useFormatDuration } from '../../../../../hooks/useFormatDuration';
import CustomField from '../../../components/CustomField';
import { AgentField, ContactField, SlaField } from '../../components';
import PriorityField from '../../components/PriorityField';
import { formatQueuedAt } from '../../utils/formatQueuedAt';
import DepartmentField from './DepartmentField';
import VisitorClientInfo from './VisitorClientInfo';

function ChatInfoDirectory({ id, route = undefined, room }) {
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();
	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('/v1/livechat/custom-fields');
	const [customFields, setCustomFields] = useState([]);
	const formatDuration = useFormatDuration();

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
		queuedAt,
	} = room || { room: { v: {} } };

	const routePath = useRoute(route || 'omnichannel-directory');
	const canViewCustomFields = () => hasPermission('view-livechat-room-customfields');
	const subscription = useUserSubscription(id);
	const hasGlobalEditRoomPermission = hasPermission('save-others-livechat-room-info');
	const hasLocalEditRoomPermission = servedBy?._id === Meteor.userId();
	const visitorId = v?._id;
	const queueStartedAt = queuedAt || ts;

	const queueTime = useMemo(() => formatQueuedAt(room), [room]);

	const dispatchToastMessage = useToastMessageDispatch();
	useEffect(() => {
		if (allCustomFields) {
			const { customFields: customFieldsAPI } = allCustomFields;
			setCustomFields(customFieldsAPI);
		}
	}, [allCustomFields, stateCustomFields]);

	const checkIsVisibleAndScopeRoom = (key) => {
		const field = customFields.find(({ _id }) => _id === key);
		if (field && field.visibility === 'visible' && field.scope === 'room') {
			return true;
		}
		return false;
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

	return (
		<>
			<ContextualbarScrollableContent p={24}>
				<Margins block='x4'>
					{room && v && <ContactField contact={v} room={room} />}
					{visitorId && <VisitorClientInfo uid={visitorId} />}
					{servedBy && <AgentField agent={servedBy} />}
					{departmentId && <DepartmentField departmentId={departmentId} />}
					{tags && tags.length > 0 && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Tags')}</InfoPanelLabel>
							<InfoPanelText>
								{tags.map((tag) => (
									<Box key={tag} mie={4} display='inline'>
										<Tag style={{ display: 'inline' }} disabled>
											{tag}
										</Tag>
									</Box>
								))}
							</InfoPanelText>
						</InfoPanelField>
					)}
					{topic && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Topic')}</InfoPanelLabel>
							<InfoPanelText withTruncatedText={false}>
								<MarkdownText variant='inline' content={topic} />
							</InfoPanelText>
						</InfoPanelField>
					)}
					{queueStartedAt && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Queue_Time')}</InfoPanelLabel>
							{queueTime}
						</InfoPanelField>
					)}
					{closedAt && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Chat_Duration')}</InfoPanelLabel>
							<InfoPanelText>{moment(closedAt).from(moment(ts), true)}</InfoPanelText>
						</InfoPanelField>
					)}
					{ts && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Created_at')}</InfoPanelLabel>
							<InfoPanelText>{formatDateAndTime(ts)}</InfoPanelText>
						</InfoPanelField>
					)}
					{closedAt && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Closed_At')}</InfoPanelLabel>
							<InfoPanelText>{formatDateAndTime(closedAt)}</InfoPanelText>
						</InfoPanelField>
					)}
					{servedBy?.ts && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Taken_at')}</InfoPanelLabel>
							<InfoPanelText>{formatDateAndTime(servedBy.ts)}</InfoPanelText>
						</InfoPanelField>
					)}
					{metrics?.response?.avg && formatDuration(metrics.response.avg) && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Avg_response_time')}</InfoPanelLabel>
							<InfoPanelText>{formatDuration(metrics.response.avg)}</InfoPanelText>
						</InfoPanelField>
					)}
					{!waitingResponse && responseBy?.lastMessageTs && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Inactivity_Time')}</InfoPanelLabel>
							<InfoPanelText>{moment(responseBy.lastMessageTs).fromNow(true)}</InfoPanelText>
						</InfoPanelField>
					)}
					{canViewCustomFields() &&
						livechatData &&
						Object.keys(livechatData).map(
							(key) => checkIsVisibleAndScopeRoom(key) && livechatData[key] && <CustomField key={key} id={key} value={livechatData[key]} />,
						)}
					{slaId && <SlaField id={slaId} />}
					{priorityId && <PriorityField id={priorityId} />}
				</Margins>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button icon='pencil' onClick={onEditClick}>
						{t('Edit')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
}

export default ChatInfoDirectory;
