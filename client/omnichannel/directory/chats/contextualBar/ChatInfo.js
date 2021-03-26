import { css } from '@rocket.chat/css-in-js';
import { Box, Margins, Tag, Avatar, Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import React from 'react';

import { roomTypes } from '../../../../../app/utils/client';
import UserCard from '../../../../components/UserCard';
import { UserStatus } from '../../../../components/UserStatus';
import VerticalBar from '../../../../components/VerticalBar';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useRoute } from '../../../../contexts/RouterContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { FormSkeleton } from '../../Skeleton';

const wordBreak = css`
	word-break: break-word;
`;
const Label = (props) => <Box fontScale='p2' color='default' {...props} />;
const Info = ({ className, ...props }) => (
	<UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props} />
);

const DepartmentField = ({ departmentId }) => {
	const t = useTranslation();
	const { value: data, phase: state } = useEndpointData(`livechat/department/${departmentId}`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}
	const {
		department: { name },
	} = data || { department: {} };
	return (
		<>
			<Label>{t('Department')}</Label>
			<Info>{name}</Info>
		</>
	);
};

const ContactField = ({ contact, room }) => {
	const t = useTranslation();
	const { username, status } = contact;
	const { fname, t: type } = room;
	const avatarUrl = roomTypes.getConfig(type).getAvatarPath(room);

	return (
		<>
			<Label>{t('Contact')}</Label>
			<Info style={{ display: 'flex' }}>
				<Avatar size='x40' title={fname} url={avatarUrl} />
				<UserCard.Username mis='x10' name={username} status={<UserStatus status={status} />} />
			</Info>
		</>
	);
};

const AgentField = ({ agent }) => {
	const t = useTranslation();
	const { username } = agent;
	const { value, phase: state } = useEndpointData(`users.info?username=${username}`);

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	const {
		user: { status },
	} = value || { user: {} };

	return (
		<>
			<Label>{t('Agent')}</Label>
			<Info style={{ display: 'flex' }}>
				<UserAvatar size='x40' title={username} username={username} />
				<UserCard.Username mis='x10' name={username} status={<UserStatus status={status} />} />
			</Info>
		</>
	);
};

export function ChatInfo({ id, route }) {
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();

	const { value: data, phase: state, error } = useEndpointData(`rooms.info?roomId=${id}`);
	const {
		room: { ts, tags, closedAt, departmentId, v, servedBy, metrics, topic },
	} = data || { room: { v: {} } };
	const routePath = useRoute(route || 'omnichannel-directory');

	const onEditClick = useMutableCallback(() =>
		routePath.push(
			route
				? {
						context: 'edit',
						id,
				  }
				: {
						tab: 'chats',
						context: 'edit',
						id,
				  },
		),
	);

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
					{ts && metrics?.reaction?.fd && (
						<>
							<Label>{t('Queue_Time')}</Label>
							<Info>{moment(ts).from(moment(metrics.reaction.fd), true)}</Info>
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
					{metrics?.v?.lq && (
						<>
							<Label>{t('Inactivity_Time')}</Label>
							{closedAt ? (
								<Info>{moment(closedAt).from(moment(metrics.v.lq), true)}</Info>
							) : (
								<Info>{moment(metrics.v.lq).fromNow()}</Info>
							)}
						</>
					)}
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
