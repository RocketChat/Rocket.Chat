import React from 'react';
import moment from 'moment';
import { Box, Margins, Tag, Avatar } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

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
	const { username, status } = contact;
	const { fname, t: type } = room;
	const avatarUrl = roomTypes.getConfig(type).getAvatarPath(room);

	return <>
		<Label>{t('Contact')}</Label>
		<Info style={{ display: 'flex' }}>
			<Avatar size='x40' title={fname} url={avatarUrl} />
			<UserCard.Username mis='x10' name={username} status={<UserStatus status={status} />} />
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

	const { user: { status } } = value || { user: { } };

	return <>
		<Label>{t('Agent')}</Label>
		<Info style={{ display: 'flex' }}>
			<UserAvatar size='x40' title={username} username={username} />
			<UserCard.Username mis='x10' name={username} status={<UserStatus status={status} />} />
		</Info>
	</>;
};

export function ChatInfo({ id }) {
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();

	const { value: data, phase: state, error } = useEndpointData(`rooms.info?roomId=${ id }`);
	const { room: { ts, tags, closedAt, departmentId, v, servedBy } } = data || { room: { v: { } } };

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	if (error || !data || !data.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	console.log(data.room);

	return <>
		<VerticalBar.ScrollableContent p='x24'>
			<Margins block='x4'>
				<ContactField contact={v} room={data.room} />
				<AgentField agent={servedBy} />
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
			</Margins>
		</VerticalBar.ScrollableContent>
	</>;
}
