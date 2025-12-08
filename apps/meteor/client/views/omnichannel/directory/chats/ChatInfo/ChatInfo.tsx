import type { IOmnichannelRoom, IVisitor } from '@rocket.chat/core-typings';
import { Box, Margins, Tag, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { ContextualbarScrollableContent, ContextualbarFooter, InfoPanelField, InfoPanelLabel, InfoPanelText } from '@rocket.chat/ui-client';
import type { IRouterPaths } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch, useRoute, useUserSubscription, useTranslation, usePermission, useUserId } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import { useMemo } from 'react';

import DepartmentField from './DepartmentField';
import VisitorClientInfo from './VisitorClientInfo';
import MarkdownText from '../../../../../components/MarkdownText';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { useFormatDuration } from '../../../../../hooks/useFormatDuration';
import CustomField from '../../../components/CustomField';
import { useValidCustomFields } from '../../../contactInfo/hooks/useValidCustomFields';
import { AgentField, SlaField, ContactField, SourceField } from '../../components';
import PriorityField from '../../components/PriorityField';
import { useOmnichannelRoomInfo } from '../../hooks/useOmnichannelRoomInfo';
import { formatQueuedAt } from '../../utils/formatQueuedAt';

type ChatInfoProps = {
	id: string;
	route: keyof IRouterPaths;
};

// TODO: Remove moment we are mixing moment and our own formatters :sadface:
function ChatInfo({ id, route }: ChatInfoProps) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const formatDateAndTime = useFormatDateAndTime();
	const formatDuration = useFormatDuration();

	const { data: room } = useOmnichannelRoomInfo(id); // FIXME: `room` is serialized, but we need to deserialize it

	const {
		_id: roomId,
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
	} = room ?? {};

	const routePath = useRoute(route || 'omnichannel-directory');
	const subscription = useUserSubscription(id);
	const hasGlobalEditRoomPermission = usePermission('save-others-livechat-room-info');
	const hasLocalEditRoomPermission = servedBy?._id === useUserId();
	const visitorId = v?._id;
	const queueStartedAt = queuedAt || ts;

	const queueTime = useMemo(() => formatQueuedAt(room), [room]);

	const customFieldEntries = useValidCustomFields(livechatData);

	const onEditClick = useEffectEvent(() => {
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
					{source && <SourceField room={room as unknown as IOmnichannelRoom} />}
					{room && v && <ContactField contact={v as IVisitor} room={room as unknown as IOmnichannelRoom} />}
					{visitorId && <VisitorClientInfo uid={visitorId} />}
					{servedBy && <AgentField agent={servedBy as unknown as IOmnichannelRoom['servedBy']} />}
					{departmentId && <DepartmentField departmentId={departmentId} />}
					{tags && tags.length > 0 && (
						<InfoPanelField>
							<InfoPanelLabel id={`${roomId}-tags`}>{t('Tags')}</InfoPanelLabel>
							<InfoPanelText>
								<ul aria-labelledby={`${roomId}-tags`}>
									{tags.map((tag) => (
										<Box is='li' key={tag} mie={4} display='inline'>
											<Tag style={{ display: 'inline' }} disabled>
												{tag}
											</Tag>
										</Box>
									))}
								</ul>
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
					{customFieldEntries?.length > 0 &&
						customFieldEntries.map(([key, value]) => <CustomField key={key} id={key} value={value as string} />)}
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

export default ChatInfo;
