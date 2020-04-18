import React from 'react';
import { Box, Avatar, Button, ButtonGroup, Icon, Margins } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { roomTypes } from '../../../../../utils/client';

export function UserInfo({ ...props }) {
	const t = useTranslation();
	const data = {
		_id: 'ajbwbi41321ko666daiywdabwdrolauiawudhi',
		name: 'Gabriel',
		username: 'gabriellsh',
		status: 'online',
		emails: [{ address: 'gabriel.henriques@rocket.chat' }],
		createdAt: '2016-12-07T15:47:46.861Z',
		lastLogin: '2016-12-07T15:47:46.861Z',
	};

	const avatarUrl = roomTypes.getConfig('d').getAvatarPath({ name: data.username || data.name, type: 'd', _id: data._id });

	return <Box display='flex' flexDirection='column' alignItems='center' w='full' h='full' pb='x24'>
		<Avatar size={'x120'} title={data.username} url={avatarUrl} mb='x20'/>
		<Box textStyle='h1'>{data.name || data.username}</Box>
		{!!data.name && <Box textStyle='p1' textColor='hint'>@{data.username}</Box>}
		<Box textStyle='p1' textColor='hint'>{data.status}</Box>
		<Box display='flex' flexDirection='row' mb='x8'>
			<ButtonGroup>
				<Button ghost><Icon name='chat' size='x16' mie='x8'/>{t('Direct_message')}</Button>
				<Button ghost><Icon name='edit' size='x16' mie='x8'/>{t('Edit')}</Button>
			</ButtonGroup>
		</Box>

		<Box display='flex' flexDirection='column' w='full'>
			<Margins block='x4'>
				<Box textStyle='micro' textColor='hint'>{t('Email')}</Box>
				<Box textStyle='s1'>{data.emails[0].address}</Box>
				<Box textStyle='micro' textColor='hint'>{t('Created_at')}</Box>
				<Box textStyle='s1'>{data.createdAt}</Box>
				<Box textStyle='micro' textColor='hint'>{t('Last_login')}</Box>
				<Box textStyle='s1'>{data.lastLogin}</Box>
			</Margins>
		</Box>

	</Box>;
}
