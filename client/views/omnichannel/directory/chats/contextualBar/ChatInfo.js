import { Box, Margins, Tag, Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import React, { useEffect, useState } from 'react';

import { hasPermission } from '../../../../../../app/authorization/client';
import VerticalBar from '../../../../../components/VerticalBar';
import { useRoute } from '../../../../../contexts/RouterContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUserSubscription } from '../../../../../contexts/UserContext';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { useFormatDuration } from '../../../../../hooks/useFormatDuration';
import { FormSkeleton } from '../../Skeleton';
import AgentField from './AgentField';
import ContactField from './ContactField';
import CustomField from './CustomField';
import DepartmentField from './DepartmentField';
import Info from './Info';
import Label from './Label';
import PriorityField from './PriorityField';
import VisitorClientInfo from './VisitorClientInfo';

function ChatInfo({ id, route }) {
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();
	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData(
		'livechat/custom-fields',
	);
	const [customFields, setCustomFields] = useState([]);
	const formatDuration = useFormatDuration();
	const { value: data, phase: state, error } = useEndpointData(`rooms.info?roomId=${id}`);
	const {
		room: {
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
			priorityId,
			livechatData,
		},
	} = data || { room: { v: {} } };
	const routePath = useRoute(route || 'omnichannel-directory');
	const canViewCustomFields = () => hasPermission('view-livechat-room-customfields');
	const subscription = useUserSubscription(id);
	const hasGlobalEditRoomPermission = hasPermission('save-others-livechat-room-info');
	const visitorId = v?._id;

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
		const hasEditAccess = !!subscription || hasGlobalEditRoomPermission;
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
						tab: 'chats',
						context: 'edit',
						id,
				  },
		);
	});

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !data || !data.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	return (
		<>
			<VerticalBar.ScrollableContent p='x24'>
				<Margins block='x4'>
					<ContactField contact={v} room={data.room} />
					{visitorId && <VisitorClientInfo uid={visitorId} />}
					{servedBy && <AgentField agent={servedBy} />}
					{departmentId && <DepartmentField departmentId={departmentId} />}
					{tags && tags.length > 0 && (
						<>
							<Label>{t('Tags')}</Label>
							<Info>
								{tags.map((tag) => (
									<Box key={tag} mie='x4' display='inline'>
										<Tag style={{ display: 'inline' }} disabled>
											{tag}
										</Tag>
									</Box>
								))}
							</Info>
						</>
					)}
					{topic && (
						<>
							<Label>{t('Topic')}</Label>
							<Info>{topic}</Info>
						</>
					)}
					{ts && (
						<>
							<Label>{t('Queue_Time')}</Label>
							{servedBy ? (
								<Info>{moment(servedBy.ts).from(moment(ts), true)}</Info>
							) : (
								<Info>{moment(ts).fromNow(true)}</Info>
							)}
						</>
					)}
					{closedAt && (
						<>
							<Label>{t('Chat_Duration')}</Label>
							<Info>{moment(closedAt).from(moment(ts), true)}</Info>
						</>
					)}
					{ts && (
						<>
							<Label>{t('Created_at')}</Label>
							<Info>{formatDateAndTime(ts)}</Info>
						</>
					)}
					{closedAt && (
						<>
							<Label>{t('Closed_At')}</Label>
							<Info>{formatDateAndTime(closedAt)}</Info>
						</>
					)}
					{servedBy?.ts && (
						<>
							<Label>{t('Taken_at')}</Label>
							<Info>{formatDateAndTime(servedBy.ts)}</Info>
						</>
					)}
					{metrics?.response?.avg && formatDuration(metrics.response.avg) && (
						<>
							<Label>{t('Avg_response_time')}</Label>
							<Info>{formatDuration(metrics.response.avg)}</Info>
						</>
					)}
					{!waitingResponse && (
						<>
							<Label>{t('Inactivity_Time')}</Label>
							<Info>{moment(responseBy.lastMessageTs).fromNow(true)}</Info>
						</>
					)}
					{canViewCustomFields() &&
						livechatData &&
						Object.keys(livechatData).map(
							(key) =>
								checkIsVisibleAndScopeRoom(key) &&
								livechatData[key] && <CustomField key={key} id={key} value={livechatData[key]} />,
						)}
					{priorityId && <PriorityField id={priorityId} />}
				</Margins>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button onClick={onEditClick}>
						<Icon name='pencil' size='x20' /> {t('Edit')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
}

export default ChatInfo;
