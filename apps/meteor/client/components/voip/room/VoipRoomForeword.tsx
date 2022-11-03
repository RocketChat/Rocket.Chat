import type { IVoipRoom } from '@rocket.chat/core-typings';
import { Avatar, Box, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { getUserAvatarURL } from '../../../../app/utils/client';
import { parseOutboundPhoneNumber } from '../../../../ee/client/lib/voip/parseOutboundPhoneNumber';

export const VoipRoomForeword = ({ room }: { room: IVoipRoom }): ReactElement => {
	const t = useTranslation();

	const avatarUrl = getUserAvatarURL(room.name);

	const roomName = room.fname;

	return (
		<Box is='div' flexGrow={1} display='flex' justifyContent='center' flexDirection='column'>
			<Box display='flex' justifyContent='center' mbs='x24'>
				<Avatar size='x48' title={room.name} url={avatarUrl} />
			</Box>
			<Box color='default' fontScale='h2' flexGrow={1} mb='x16'>
				{t('You_have_joined_a_new_call_with')}
			</Box>
			<Box is='div' mb='x8' flexGrow={1} display='flex' justifyContent='center'>
				<Box mi='x4'>
					<Tag style={{ cursor: 'default' }} variant='primary' medium>
						{roomName && parseOutboundPhoneNumber(roomName)}
					</Tag>
				</Box>
			</Box>
		</Box>
	);
};
