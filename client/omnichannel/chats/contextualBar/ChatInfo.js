import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { Box, Margins, Tag, Avatar, Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import UAParser from 'ua-parser-js';

import VerticalBar from '../../../components/VerticalBar';
import UserCard from '../../../components/UserCard';
import { FormSkeleton } from '../../directory/Skeleton';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useFormatDuration } from '../../../hooks/useFormatDuration';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { UserStatus } from '../../../components/UserStatus';
import { roomTypes } from '../../../../app/utils/client';
import { useRoute } from '../../../contexts/RouterContext';
import { hasPermission } from '../../../../app/authorization';
import { useUserSubscription } from '../../../contexts/UserContext';

const wordBreak = css`
	word-break: break-word;
`;
const Label = (props) => <Box fontScale='p2' color='default' {...props} />;
const Field = ({ children, ...props }) => <Box {...props }><Margins block='x4'>{children}</Margins></Box>;
const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;

const DepartmentField = ({ departmentId }) => {
	const t = useTranslation();
	const { value: data, phase: state } = useEndpointData(`livechat/department/${ departmentId }`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}
	const { department: { name } } = data || { department: {} };
	return <Field>
		<Label>{t('Department')}</Label>
		<Info>{name}</Info>
	</Field>;
};

const ContactField = ({ contact, room }) => {
	const t = useTranslation();
	const { status } = contact;
	const { fname, t: type } = room;
	const avatarUrl = roomTypes.getConfig(type).getAvatarPath(room);

	const { value: data, phase: state, error } = useEndpointData(`livechat/visitors.info?visitorId=${ contact._id }`);

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !data || !data.visitor) {
		return <Box mbs='x16'>{t('Contact_not_found')}</Box>;
	}

	const { visitor: { username, name } } = data;

	const displayName = name || username;

	return <Field>
		<Label>{t('Contact')}</Label>
		<Info style={{ display: 'flex' }}>
			<Avatar size='x40' title={fname} url={avatarUrl} />
			<UserCard.Username mis='x10' name={displayName} status={<UserStatus status={status} />} />
			{username && name && <Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>({username})</Box>}
		</Info>
	</Field>;
};

const AgentField = ({ agent }) => {
	const t = useTranslation();
	const { username } = agent;
	const { value, phase: state } = useEndpointData(`users.info?username=${ username }`);

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	const { user: { name, status } } = value || { user: { } };

	const displayName = name || username;

	return <Field>
		<Label>{t('Agent')}</Label>
		<Info style={{ display: 'flex' }}>
			<UserAvatar size='x40' title={username} username={username} />
			<UserCard.Username mis='x10' name={displayName} status={<UserStatus status={status} />} />
			{username && name && <Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>({username})</Box>}
		</Info>
	</Field>;
};

const CustomField = ({ id, value }) => {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`livechat/custom-fields/${ id }`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}
	if (error || !data || !data.customField) {
		return <Box mbs='x16'>{t('Custom_Field_Not_Found')}</Box>;
	}
	const { label } = data.customField;
	return label && <Field>
		<Label>{label}</Label>
		<Info>{value}</Info>
	</Field>;
};

const PriorityField = ({ id }) => {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`livechat/priorities.getOne?priorityId=${ id }`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}
	if (error || !data) {
		return <Box mbs='x16'>{t('Custom_Field_Not_Found')}</Box>;
	}
	const { name } = data;
	return <Field>
		<Label>{t('Priority')}</Label>
		<Info>{name}</Info>
	</Field>;
};

const VisitorClientInfo = ({ uid }) => {
	const t = useTranslation();
	const { value: userData, phase: state, error } = useEndpointData(`livechat/visitors.info?visitorId=${ uid }`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !userData || !userData.userAgent) {
		return null;
	}

	const clientData = {};
	const ua = new UAParser();
	ua.setUA(userData.userAgent);
	clientData.os = `${ ua.getOS().name } ${ ua.getOS().version }`;
	clientData.browser = `${ ua.getBrowser().name } ${ ua.getBrowser().version }`;

	return <>
		{clientData.os && <Field>
			<Label>{t('OS')}</Label>
			<Info>{clientData.os}</Info>
		</Field>}
		{clientData.browser && <Field>
			<Label>{t('Browser')}</Label>
			<Info>{clientData.browser}</Info>
		</Field>}
	</>;
};

export function ChatInfo({ id, route }) {
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();
	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('livechat/custom-fields');
	const [customFields, setCustomFields] = useState([]);
	const formatDuration = useFormatDuration();
	const { value: data, phase: state, error } = useEndpointData(`rooms.info?roomId=${ id }`);
	const { room: { ts, tags, closedAt, departmentId, v, servedBy, metrics, topic, waitingResponse, responseBy, priorityId, livechatData } } = data || { room: { v: { } } };
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
		if (field && field.visibility === 'visible' && field.scope === 'room') { return true; }
		return false;
	};

	const onEditClick = useMutableCallback(() => {
		const hasEditAccess = !!subscription || hasGlobalEditRoomPermission;
		if (!hasEditAccess) {
			return dispatchToastMessage({ type: 'error', message: t('Not_authorized') });
		}

		routePath.push(
			route ? {
				tab: 'room-info',
				context: 'edit',
				id,
			} : {
				tab: 'chats',
				context: 'edit',
				id,
			});
	});


	if (state === AsyncStatePhase.LOADING) {
		return <Box pi='x24'><FormSkeleton /></Box>;
	}

	if (error || !data || !data.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	return <>
		<VerticalBar.ScrollableContent p='x24'>
			<ContactField contact={v} room={data.room} />
			{visitorId && <VisitorClientInfo uid={visitorId}/>}
			{servedBy && <AgentField agent={servedBy} />}
			{departmentId && <DepartmentField departmentId={departmentId} />}
			{tags && tags.length > 0 && <>
				<Label>{t('Tags')}</Label>
				<Info>
					{tags.map((tag) => (
						<Box key={tag} mie='x4' display='inline'>
							<Tag style={{ display: 'inline' }} disabled>{tag}</Tag>
						</Box>
					))}
				</Info>
			</>}
			{topic && <Field>
				<Label>{t('Topic')}</Label>
				<Info>{topic}</Info>
			</Field>}
			{ts && <Field>
				<Label>{t('Queue_Time')}</Label>
				{
					servedBy
						? <Info>{moment(servedBy.ts).from(moment(ts), true)}</Info>
						: <Info>{moment(ts).fromNow(true)}</Info>
				}
			</Field>}
			{closedAt && <Field>
				<Label>{t('Chat_Duration')}</Label>
				<Info>{moment(closedAt).from(moment(ts), true)}</Info>
			</Field>}
			{ts && <Field>
				<Label>{t('Created_at')}</Label>
				<Info>{formatDateAndTime(ts)}</Info>
			</Field>}
			{closedAt && <Field>
				<Label>{t('Closed_At')}</Label>
				<Info>{formatDateAndTime(closedAt)}</Info>
			</Field>}
			{servedBy?.ts && <Field>
				<Label>{t('Taken_at')}</Label>
				<Info>{formatDateAndTime(servedBy.ts)}</Info>
			</Field>}
			{metrics?.response?.avg && formatDuration(metrics.response.avg) && <Field>
				<Label>{t('Avg_response_time')}</Label>
				<Info>{formatDuration(metrics.response.avg)}</Info>
			</Field>}
			{!waitingResponse && <Field>
				<Label>{t('Inactivity_Time')}</Label>
				<Info>{moment(responseBy.lastMessageTs).fromNow(true)}</Info>
			</Field>}
			{ canViewCustomFields()
				&& livechatData
				&& Object.keys(livechatData).map((key) => checkIsVisibleAndScopeRoom(key) && livechatData[key] && <CustomField key={key} id={key} value={livechatData[key]} />)
			}
			{priorityId && <PriorityField id={priorityId} />}
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup stretch>
				<Button onClick={onEditClick}><Icon name='pencil' size='x20'/> {t('Edit')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</>;
}
