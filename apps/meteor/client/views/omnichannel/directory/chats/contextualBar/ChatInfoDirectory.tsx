import type { ILivechatCustomField, IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';
import { Box, Tag, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { IRouterPaths } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch, useRoute, useUserSubscription, useTranslation } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';

import { hasPermission } from '../../../../../../app/authorization/client';
import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../../../components/Contextualbar';
import InfoPanel from '../../../../../components/InfoPanel';
import MarkdownText from '../../../../../components/MarkdownText';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { useFormatDuration } from '../../../../../hooks/useFormatDuration';
import CustomField from '../../../components/CustomField';
import { AgentField, ContactField, SlaField, SourceField } from '../../components';
import PriorityField from '../../components/PriorityField';
import { formatQueuedAt } from '../../utils/formatQueuedAt';
import DepartmentField from './DepartmentField';
import VisitorClientInfo from './VisitorClientInfo';

const ChatInfoDirectory = ({ id, route = undefined, room }: { id: string; route?: keyof IRouterPaths; room: IOmnichannelRoom }) => {
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();
	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('/v1/livechat/custom-fields');
	const [customFields, setCustomFields] = useState<Serialized<ILivechatCustomField>[]>([]);
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
		source,
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

	const checkIsVisibleAndScopeRoom = (key: string) => {
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
				<InfoPanel>
					{source && <SourceField room={room as IOmnichannelRoom} />}
					{/* TODO: Sort out differences in different visitor object types and if status is optional or not */}
					{room && v && <ContactField contact={v as any} room={room} />}
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
							<InfoPanel.Text>{formatDateAndTime(metrics.response.avg)}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{!waitingResponse && responseBy?.lastMessageTs && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Inactivity_Time')}</InfoPanel.Label>
							<InfoPanel.Text>{moment(responseBy.lastMessageTs).fromNow(true)}</InfoPanel.Text>
						</InfoPanel.Field>
					)}
					{canViewCustomFields() &&
						livechatData &&
						Object.keys(livechatData).map(
							(key) => checkIsVisibleAndScopeRoom(key) && livechatData[key] && <CustomField key={key} id={key} value={livechatData[key]} />,
						)}
					{slaId && <SlaField id={slaId} />}
					{priorityId && <PriorityField id={priorityId} />}
				</InfoPanel>
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
};

export default ChatInfoDirectory;
