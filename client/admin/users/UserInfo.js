import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Box, Avatar, Margins, Chip, Tag } from '@rocket.chat/fuselage';
import moment from 'moment';

import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../contexts/TranslationContext';
import { roomTypes } from '../../../app/utils/client';
import { DateFormat } from '../../../app/lib';
import { UserInfoActions } from './UserInfoActions';
import MarkdownText from '../../components/basic/MarkdownText';
import VerticalBar from '../../components/basic/VerticalBar';
import { FormSkeleton } from './Skeleton';

const useTimezoneClock = (utcOffset = 0, updateInterval) => {
	const [time, setTime] = useState();
	useEffect(() => {
		const updateTime = () => setTime(DateFormat.formatTime(moment().get().utcOffset(utcOffset)));
		const interval = setInterval(() => updateTime(), updateInterval);
		updateTime();

		return () => clearInterval(interval);
	}, [utcOffset, updateInterval]);

	return time;
};

const UTCClock = ({ utcOffset, ...props }) => {
	const time = useTimezoneClock(utcOffset, 10000);
	return <Box {...props}>{time} UTC {utcOffset}</Box>;
};

export function UserInfoWithData({ uid, ...props }) {
	const t = useTranslation();
	const [cache, setCache] = useState();

	const onChange = () => setCache(new Date());

	const { data, state, error } = useEndpointDataExperimental('users.info', useMemo(() => ({ userId: uid }), [uid, cache]));

	if (state === ENDPOINT_STATES.LOADING) {
		return <FormSkeleton/>;
	}

	if (error) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}

	return <UserInfo data={data.user} onChange={onChange} {...props} />;
}


export function UserInfo({ data, onChange, ...props }) {
	const t = useTranslation();

	const createdAt = DateFormat.formatDateAndTime(data.createdAt);

	const lastLogin = data.lastLogin ? DateFormat.formatDateAndTime(data.lastLogin) : '';

	const avatarUrl = roomTypes.getConfig('d').getAvatarPath({ name: data.username || data.name, type: 'd', _id: data._id });

	return <VerticalBar.ScrollableContent is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} {...props}>
		<Box display='flex' flexDirection='column' alignItems='center' flexShrink={0} withTruncatedText>
			<Margins block='x2' inline='auto'>
				<Avatar size={'x120'} title={data.username} url={avatarUrl}/>
				<Box fontScale='h1' withTruncatedText>{data.name || data.username}</Box>
				{!!data.name && <Box fontScale='p1' color='hint' withTruncatedText>@{data.username}</Box>}
				<Box fontScale='p1' color='hint' withTruncatedText>{data.status}</Box>
			</Margins>
		</Box>

		<UserInfoActions isActive={data.active} isAdmin={data.roles.includes('admin')} _id={data._id} username={data.username} onChange={onChange}/>
		<Box display='flex' flexDirection='column' w='full' backgroundColor='neutral-200' p='x16' withTruncatedTex flexShrink={0}t>
			<Margins blockEnd='x4'>
				{data.bio && data.bio.trim().length > 0 && <Box withTruncatedText> <MarkdownText fontScale='s1'>{data.bio}</MarkdownText></Box>}
				{!!data.roles.length && <>
					<Box fontScale='micro' color='hint' mbs='none'>{t('Roles')}</Box>
					<Box display='flex' flexDirection='row' flexWrap='wrap'>
						<Margins inlineEnd='x4' blockEnd='x4'>
							{data.roles.map((val) => <Chip pi='x4' key={val}>{val}</Chip>)}
						</Margins>
					</Box>
				</>}

				{data.emails && <> <Box fontScale='micro' color='hint'>{t('Email')}</Box>
					<Box display='flex' flexDirection='row' alignItems='center'>
						<Box fontScale='s1' withTruncatedText>{data.emails[0].address}</Box>
						<Margins inline='x4'>
							{data.emails[0].verified && <Tag variant='primary'>{t('Verified')}</Tag>}
							{data.emails[0].verified || <Tag disabled>{t('Not_verified')}</Tag>}
						</Margins>
					</Box>
				</>}

				<Box fontScale='micro' color='hint'>{t('Created_at')}</Box>
				<Box fontScale='s1'>{createdAt}</Box>

				<Box fontScale='micro' color='hint'>{t('Last_login')}</Box>
				<Box fontScale='s1' >{lastLogin || t('Never')}</Box>

				{!!data.utcOffset && <>
					<Box fontScale='micro' color='hint'>{t('Timezone')}</Box>
					<UTCClock utcOffset={data.utcOffset} mbe='none' fontScale='s1' />
				</>}
			</Margins>
		</Box>
	</VerticalBar.ScrollableContent>;
}
