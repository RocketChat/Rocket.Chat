import React, { useState } from 'react';
import { Box, Avatar, Button, Icon, TextInput, Margins } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';


export function SetAvatar({ currentAvatarUrl = '', setFile }) {
	const t = useTranslation();
	const [avatarUrl, setAvatarUrl] = useState('');

	return <Box display='flex' flexDirection='column' textStyle='p2'>
		{t('Profile_Picture')}
		<Box display='flex' flexDirection='row'>
			<Avatar size='x120' url={currentAvatarUrl} />
			<Box display='flex' flexDirection='column'>
				<Margins block ='x4'>
					<Box display='flex' flexDirection='row'>
						<Margins inline='x4'>
							<Button square large></Button>
							<Button square large><Icon name='upload' /></Button>
							<Button square large><Icon name='link' /></Button>
						</Margins>
					</Box>
					<Box>{t('Use_URL_for_avatar')}</Box>
					<TextInput placehloder={t('Use_URL_for_avatar')} value={avatarUrl} onChange={(e) => setAvatarUrl(e.currentTarger.value)}/>
				</Margins>
			</Box>
		</Box>
	</Box>;
}
