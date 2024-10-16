import type { ILivechatContactChannel, Serialized } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import React from 'react';

// import { ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import { OmnichannelRoomIcon } from '../../../../components/RoomIcon/OmnichannelRoomIcon';
// import { useFormatDate } from '../../../../hooks/useFormatDate';
// import { useTimeAgo } from '../../../../hooks/useTimeAgo';

type ContactInfoHistoryItemProps = Serialized<ILivechatContactChannel>;

const ContactInfoHistoryItem = ({ name, details, ...props }: ContactInfoHistoryItemProps) => {
	// const formatDate = useFormatDate();
	// const timeAgo = useTimeAgo();

	return (
		<Box display='flex' alignItems='center' {...props}>
			{details && (
				<Box size='x36' p={8} backgroundColor='tint' borderRadius={4}>
					<OmnichannelRoomIcon source={details} size='x20' placement='default' />
				</Box>
			)}
			<Box mis={4} display='flex' flexDirection='column'>
				<Box display='flex' alignItems='center'>
					<Box fontScale='p2m'>{name}</Box>
					<Box mis={4} fontScale='c1'>
						{/* {timeAgo(time)} */}
					</Box>
				</Box>
				<Box>{details?.destination}</Box>
			</Box>
		</Box>
	);
};

export default ContactInfoHistoryItem;
