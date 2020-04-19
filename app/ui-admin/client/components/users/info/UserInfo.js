import React, { useMemo } from 'react';
import { Box, Avatar, Button, ButtonGroup, Icon, Margins, Headline, Skeleton } from '@rocket.chat/fuselage';

import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../../../ee/app/engagement-dashboard/client/hooks/useEndpointData';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { roomTypes } from '../../../../../utils/client';
import { DateFormat } from '../../../../../lib';
import { useRoute } from '../../../../../../client/contexts/RouterContext';


export function UserInfo({ username, ...props }) {
	const t = useTranslation();
	const { data: endpointData = { user: {} }, state, error } = useEndpointDataExperimental('GET', 'users.info', useMemo(() => ({ username }), [username]));

	console.log('userData', endpointData);

	const directRoute = useRoute('direct/');

	const directMessageClick = (id) => () => directRoute.push({
		rid: id,
	});

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

	const data = endpointData.user;

	const createdAt = DateFormat.formatDateAndTime(data.createdAt);
	const lastLogin = data.lastLogin ? DateFormat.formatDateAndTime(data.lastLogin) : '';

	const avatarUrl = roomTypes.getConfig('d').getAvatarPath({ name: data.username || data.name, type: 'd', _id: data._id });

	return <Box display='flex' flexDirection='column' alignItems='center' w='full' h='full' pb='x24'>
		<Avatar size={'x120'} title={data.username} url={avatarUrl} mb='x20'/>
		<Box textStyle='h1'>{data.name || data.username}</Box>
		{!!data.name && <Box textStyle='p1' textColor='hint'>@{data.username}</Box>}
		<Box textStyle='p1' textColor='hint'>{data.status}</Box>
		<Box display='flex' flexDirection='row' mb='x20'>
			<ButtonGroup>
				<Button ghost><Icon name='chat' size='x16' mie='x8' onClick={directMessageClick(data._id)}/>{t('Direct_Message')}</Button>
				<Button ghost><Icon name='edit' size='x16' mie='x8'/>{t('Edit')}</Button>
			</ButtonGroup>
		</Box>

		<Box display='flex' flexDirection='column' w='full' style={{ backgroundColor: '#F4F6F9' }} p='x16'>
			<Box textStyle='micro' textColor='hint'>{t('Email')}</Box>
			<Margins block='x8'>
				<Box textStyle='s1'>{data.emails[0].address}</Box>
				<Box textStyle='micro' textColor='hint'>{t('Created_at')}</Box>
				<Box textStyle='s1'>{createdAt}</Box>
				<Box textStyle='micro' textColor='hint'>{t('Last_login')}</Box>
			</Margins>
			<Box textStyle='s1'>{lastLogin}</Box>
		</Box>

	</Box>;
}
