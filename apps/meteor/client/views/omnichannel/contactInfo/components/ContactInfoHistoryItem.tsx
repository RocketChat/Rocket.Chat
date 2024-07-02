import { Box } from '@rocket.chat/fuselage';
import React from 'react';

// import { ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import { OmnichannelRoomIcon } from '../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { useOmnichannelRoom } from '../../../room/contexts/RoomContext';

const ContactInfoHistoryItem = ({ name, description, time, ...props }) => {
	// const room = useOmnichannelRoom();
	const formatDate = useFormatDate();
	const timeAgo = useTimeAgo();

	return (
		<Box display='flex' alignItems='center' {...props}>
			<Box p={8} backgroundColor='tint' borderRadius={4}>
				{/* <OmnichannelRoomIcon room={room} size='x20' placement='default' /> */}
			</Box>
			<Box mis={4} display='flex' flexDirection='column'>
				<Box display='flex' alignItems='center'>
					<Box fontScale='p2m'>{name}</Box>
					<Box mis={4} fontScale='c1'>
						{timeAgo(time)}
					</Box>
				</Box>
				<Box>{description}</Box>
			</Box>
		</Box>
	);
};

export default ContactInfoHistoryItem;
