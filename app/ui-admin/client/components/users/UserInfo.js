import React, { useMemo, useState, useEffect } from 'react';
import { Box, Avatar, Button, ButtonGroup, Icon, Margins, Headline, Skeleton, Chip, Tag } from '@rocket.chat/fuselage';
import moment from 'moment';

import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { roomTypes } from '../../../../utils/client';
import { DateFormat } from '../../../../lib';
import { useRoute } from '../../../../../client/contexts/RouterContext';
import { Markdown } from '../../../../ui/client/components/GenericTable';
import { Page } from '../../../../../client/components/basic/Page';

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

export function UserInfoWithData({ userId, ...props }) {
	const t = useTranslation();

	const { data, state, error } = useEndpointDataExperimental('GET', 'users.info', useMemo(() => ({ userId }), [userId]));

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box w='full' pb='x24'>
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Headline.Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (error) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}

	return <UserInfo data={data.user} {...props} />;
}


export function UserInfo({ data, ...props }) {
	const t = useTranslation();

	const directRoute = useRoute('direct');
	const userRoute = useRoute('admin-users');

	const directMessageClick = () => directRoute.push({
		rid: data.username,
	});
	const editUserClick = () => userRoute.push({
		context: 'edit',
		id: data._id,
	});

	const createdAt = DateFormat.formatDateAndTime(data.createdAt);

	const lastLogin = data.lastLogin ? DateFormat.formatDateAndTime(data.lastLogin) : '';

	const avatarUrl = roomTypes.getConfig('d').getAvatarPath({ name: data.username || data.name, type: 'd', _id: data._id });

	return <Page.ContentScrolable pb='x24' mi='neg-x24' is='form' {...props}>
		<Margins block='x8'>
			<Box display='flex' flexDirection='column' alignItems='center'>
				<Margins block='x2'>
					<Avatar size={'x120'} title={data.username} url={avatarUrl}/>
					<Box textStyle='h1'>{data.name || data.username}</Box>
					{!!data.name && <Box textStyle='p1' textColor='hint'>@{data.username}</Box>}
					<Box textStyle='p1' textColor='hint'>{data.status}</Box>
				</Margins>
			</Box>

			<Box display='flex' flexDirection='row'>
				<ButtonGroup flexGrow={1} justifyContent='center'>
					<Button secondary onClick={directMessageClick}><Icon name='chat' size='x16' mie='x8'/>{t('Direct_Message')}</Button>
					<Button secondary onClick={editUserClick}><Icon name='edit' size='x16' mie='x8'/>{t('Edit')}</Button>
				</ButtonGroup>
			</Box>

			<Box display='flex' flexDirection='column' w='full' style={{ backgroundColor: '#F4F6F9' }} p='x16'>
				<Margins blockEnd='x4'>

					{data.bio && data.bio.trim().length > 0 && <Markdown textStyle='s1' mbe='x8'>{data.bio}</Markdown>}

					{data.roles && <>
						<Box textStyle='micro' textColor='hint' mbs='none'>{t('Roles')}</Box>
						<Box display='flex' flexDirection='row'>
							<Margins inlineEnd='x4'>
								{data.roles.map((val) => <Chip pi='x4' key={val}>{val}</Chip>)}
							</Margins>
						</Box>
					</>}

					{data.emails && <> <Box textStyle='micro' textColor='hint'>{t('Email')}</Box>
						<Box display='flex' flexDirection='row' alignItems='center'>
							<Box textStyle='s1'>{data.emails[0].address}</Box>
							<Margins inline='x4'>
								{data.emails[0].verified && <Tag variant='primary'>{t('Verified')}</Tag>}
								{data.emails[0].verified || <Tag disabled>{t('Not_verified')}</Tag>}
							</Margins>
						</Box>
					</>}

					<Box textStyle='micro' textColor='hint'>{t('Created_at')}</Box>
					<Box textStyle='s1'>{createdAt}</Box>

					<Box textStyle='micro' textColor='hint'>{t('Last_login')}</Box>
					<Box textStyle='s1' >{lastLogin || t('Never')}</Box>

					{!!data.utcOffset && <>
						<Box textStyle='micro' textColor='hint'>{t('Timezone')}</Box>
						<UTCClock utcOffset={data.utcOffset} mbe='none' textStyle='s1' />
					</>}
				</Margins>
			</Box>
		</Margins>

	</Page.ContentScrolable>;
}
