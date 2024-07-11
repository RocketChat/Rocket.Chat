import type { ILivechatCustomField, Serialized, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Box, Tag, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { IRouterPaths } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch, useRoute, useUserSubscription, useTranslation, usePermission } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';

import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../../../components/Contextualbar';
import { InfoPanel, InfoPanelField, InfoPanelLabel, InfoPanelText } from '../../../../../components/InfoPanel';
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
const ChatInfo = ({ id, route }: { id: string; route?: keyof IRouterPaths }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const formatDateAndTime = useFormatDateAndTime();
	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('/v1/livechat/custom-fields');
	const [customFields, setCustomFields] = useState<Serialized<ILivechatCustomField>[]>([]);
	const formatDuration = useFormatDuration();

	// TODO: Organize Omnichannel Room Types, what is serialized and what is not
	const { data: room } = useOmnichannelRoomInfo(id) as unknown as { data: IOmnichannelRoom };

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
			if (customFieldsAPI) {
				setCustomFields(customFieldsAPI);
			}
		}
	}, [allCustomFields, stateCustomFields]);

	const checkIsVisibleAndScopeRoom = (key: string) => {
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

	const customFieldEntries: [string, any][] = Object.entries(livechatData || {}).filter(
		([key]) => checkIsVisibleAndScopeRoom(key) && livechatData[key],
	);

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
							<InfoPanelText>{queueTime}</InfoPanelText>
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
					{canViewCustomFields &&
						customFieldEntries.map(([key, value]: [string, string]) => <CustomField key={key} id={key} value={value} />)}
					{slaId && <SlaField id={slaId} />}
					{priorityId && <PriorityField id={priorityId} />}
				</InfoPanel>
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
};

export default ChatInfo;
