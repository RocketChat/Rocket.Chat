import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { Box, Margins, Tag, Avatar, Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import UAParser from 'ua-parser-js';

import VerticalBar from '../../../../components/VerticalBar';
import UserCard from '../../../../components/UserCard';
import { FormSkeleton } from '../../Skeleton';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { UserStatus } from '../../../../components/UserStatus';
import { roomTypes } from '../../../../../app/utils/client';
import { useRoute } from '../../../../contexts/RouterContext';
import { hasPermission } from '../../../../../app/authorization';


const wordBreak = css`
	word-break: break-word;
`;
const Label = (props) => <Box fontScale='p2' color='default' {...props} />;
const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;

const DepartmentField = ({ departmentId }) => {
	const t = useTranslation();
	const { value: data, phase: state } = useEndpointData(`livechat/department/${ departmentId }`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}
	const { department: { name } } = data || { department: {} };
	return <>
		<Label>{t('Department')}</Label>
		<Info>{name}</Info>
	</>;
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

	return <>
		<Label>{t('Contact')}</Label>
		<Info style={{ display: 'flex' }}>
			<Avatar size='x40' title={fname} url={avatarUrl} />
			<UserCard.Username mis='x10' name={displayName} status={<UserStatus status={status} />} />
			{username && name && <Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>({username})</Box>}
		</Info>
	</>;
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

	return <>
		<Label>{t('Agent')}</Label>
		<Info style={{ display: 'flex' }}>
			<UserAvatar size='x40' title={username} username={username} />
			<UserCard.Username mis='x10' name={displayName} status={<UserStatus status={status} />} />
			{username && name && <Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>({username})</Box>}
		</Info>
	</>;
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
	return label && <>
		<Label>{label}</Label>
		<Info>{value}</Info>
	</>;
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
	return <>
		<Label>{t('Priority')}</Label>
		<Info>{name}</Info>
	</>;
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
		{clientData.os && <>
			<Label>{t('OS')}</Label>
			<Info>{clientData.os}</Info>
		</>}
		{clientData.browser && <>
			<Label>{t('Browser')}</Label>
			<Info>{clientData.browser}</Info>
		</>}
	</>;
};

export function ChatInfo({ id, route }) {
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();
	const { value: allCustomFields, phase: stateCustomFields } = useEndpointData('livechat/custom-fields');

	const [customFields, setCustomFields] = useState([]);
	const { value: data, phase: state, error } = useEndpointData(`rooms.info?roomId=${ id }`);
	const { room: { ts, tags, closedAt, departmentId, v, servedBy, metrics, topic, waitingResponse, responseBy, priorityId, livechatData } } = data || { room: { v: { } } };
	const routePath = useRoute(route || 'omnichannel-directory');
	const canViewCustomFields = () => hasPermission('view-livechat-room-customfields');
	const visitorId = v?._id;

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

	const onEditClick = useMutableCallback(() => routePath.push(
		route ? {
			context: 'edit',
			id,
		} : {
			tab: 'chats',
			context: 'edit',
			id,
		}));


	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !data || !data.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	return <>
		<VerticalBar.ScrollableContent p='x24'>
			<Margins block='x4'>
				<ContactField contact={v} room={data.room} />
				{visitorId && <VisitorClientInfo uid={visitorId}/>}
				{servedBy && <AgentField agent={servedBy} />}
				{ departmentId && <DepartmentField departmentId={departmentId} /> }
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
				{topic && <>
					<Label>{t('Topic')}</Label>
					<Info>{topic}</Info>
				</>}
				{ts && metrics?.reaction?.fd && <>
					<Label>{t('Queue_Time')}</Label>
					<Info>{moment(ts).from(moment(metrics.reaction.fd), true)}</Info>
				</>}
				{closedAt && <>
					<Label>{t('Chat_Duration')}</Label>
					<Info>{moment(closedAt).from(moment(ts), true)}</Info>
				</>}
				{ts && <>
					<Label>{t('Created_at')}</Label>
					<Info>{formatDateAndTime(ts)}</Info>
				</>}
				{closedAt && <>
					<Label>{t('Closed_At')}</Label>
					<Info>{formatDateAndTime(closedAt)}</Info>
				</>}
				{!waitingResponse && <>
					<Label>{t('Inactivity_Time')}</Label>
					<Info>{moment(responseBy.lastMessageTs).fromNow(true)}</Info>
				</>}
				{ canViewCustomFields()
					&& livechatData
					&& Object.keys(livechatData).map((key) => checkIsVisibleAndScopeRoom(key) && livechatData[key] && <CustomField key={key} id={key} value={livechatData[key]} />)
				}
				{priorityId && <PriorityField id={priorityId} />}
			</Margins>
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup stretch>
				<Button onClick={onEditClick}><Icon name='pencil' size='x20'/> {t('Edit')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</>;
}
