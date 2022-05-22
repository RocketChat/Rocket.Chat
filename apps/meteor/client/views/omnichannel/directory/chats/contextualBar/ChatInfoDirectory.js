import { Box, Margins, Tag, Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useUserSubscription, useTranslation } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import React, { useEffect, useState } from 'react';

import { hasPermission } from '../../../../../../app/authorization/client';
import VerticalBar from '../../../../../components/VerticalBar';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { useFormatDateAndTime } from '../../../../../hooks/useFormatDateAndTime';
import { useFormatDuration } from '../../../../../hooks/useFormatDuration';
import CustomField from '../../../components/CustomField';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import AgentField from './AgentField';
import ContactField from './ContactField';
import DepartmentField from './DepartmentField';
import PriorityField from './PriorityField';
import VisitorClientInfo from './VisitorClientInfo';

function ChatInfoDirectory({ id, route = undefined, room }) {
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();
	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('livechat/custom-fields');
	const [customFields, setCustomFields] = useState([]);
	const formatDuration = useFormatDuration();

	const { ts, tags, closedAt, departmentId, v, servedBy, metrics, topic, waitingResponse, responseBy, priorityId, livechatData, queuedAt } =
		room || { room: { v: {} } };

	const routePath = useRoute(route || 'omnichannel-directory');
	const canViewCustomFields = () => hasPermission('view-livechat-room-customfields');
	const subscription = useUserSubscription(id);
	const hasGlobalEditRoomPermission = hasPermission('save-others-livechat-room-info');
	const hasLocalEditRoomPermission = servedBy?._id === Meteor.userId();
	const visitorId = v?._id;
	const queueStartedAt = queuedAt || ts;

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
			<VerticalBar.ScrollableContent p='x24'>
				<Margins block='x4'>
					{room && v && <ContactField contact={v} room={room} />}
					{visitorId && <VisitorClientInfo uid={visitorId} />}
					{servedBy && <AgentField agent={servedBy} />}
					{departmentId && <DepartmentField departmentId={departmentId} />}
					{tags && tags.length > 0 && (
						<Field>
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
						</Field>
					)}
					{topic && (
						<Field>
							<Label>{t('Topic')}</Label>
							<Info>{topic}</Info>
						</Field>
					)}
					{queueStartedAt && (
						<Field>
							<Label>{t('Queue_Time')}</Label>
							{servedBy ? (
								<Info>{moment(servedBy.ts).from(moment(queueStartedAt), true)}</Info>
							) : (
								<Info>{moment(queueStartedAt).fromNow(true)}</Info>
							)}
						</Field>
					)}
					{closedAt && (
						<Field>
							<Label>{t('Chat_Duration')}</Label>
							<Info>{moment(closedAt).from(moment(ts), true)}</Info>
						</Field>
					)}
					{ts && (
						<Field>
							<Label>{t('Created_at')}</Label>
							<Info>{formatDateAndTime(ts)}</Info>
						</Field>
					)}
					{closedAt && (
						<Field>
							<Label>{t('Closed_At')}</Label>
							<Info>{formatDateAndTime(closedAt)}</Info>
						</Field>
					)}
					{servedBy?.ts && (
						<Field>
							<Label>{t('Taken_at')}</Label>
							<Info>{formatDateAndTime(servedBy.ts)}</Info>
						</Field>
					)}
					{metrics?.response?.avg && formatDuration(metrics.response.avg) && (
						<Field>
							<Label>{t('Avg_response_time')}</Label>
							<Info>{formatDuration(metrics.response.avg)}</Info>
						</Field>
					)}
					{!waitingResponse && responseBy?.lastMessageTs && (
						<Field>
							<Label>{t('Inactivity_Time')}</Label>
							<Info>{moment(responseBy.lastMessageTs).fromNow(true)}</Info>
						</Field>
					)}
					{canViewCustomFields() &&
						livechatData &&
						Object.keys(livechatData).map(
							(key) => checkIsVisibleAndScopeRoom(key) && livechatData[key] && <CustomField key={key} id={key} value={livechatData[key]} />,
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

export default ChatInfoDirectory;
