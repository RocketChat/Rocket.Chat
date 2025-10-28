import type { IVoipRoom } from '@rocket.chat/core-typings';
import { Avatar, Box, Tag } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { getUserAvatarURL } from '../../../../app/utils/client';
import { parseOutboundPhoneNumber } from '../../../lib/voip/parseOutboundPhoneNumber';

export const VoipRoomForeword = ({ room }: { room: IVoipRoom }): ReactElement => {
	const { t } = useTranslation();

	const avatarUrl = getUserAvatarURL(room.name) as string;

	const roomName = room.fname;

	return (
		<Box is='div' flexGrow={1} display='flex' justifyContent='center' flexDirection='column'>
			<Box display='flex' justifyContent='center' mbs={24}>
				<Avatar size='x48' title={room.name} url={avatarUrl} />
			</Box>
			<Box color='default' fontScale='h2' flexGrow={1} mb={16}>
				{t('You_have_joined_a_new_call_with')}
			</Box>
			<Box is='div' mb={8} flexGrow={1} display='flex' justifyContent='center'>
				<Box mi={4}>
					<Tag style={{ cursor: 'default' }} variant='primary' medium>
						{roomName && parseOutboundPhoneNumber(roomName)}
					</Tag>
				</Box>
			</Box>
		</Box>
	);
};
