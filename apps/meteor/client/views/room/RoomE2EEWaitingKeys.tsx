import { Box, States, StatesIcon, StatesLink, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import React from 'react';

const RoomE2EEWaitingKeys = () => {
	return (
		<Box display='flex' justifyContent='center' height='full'>
			<States>
				<StatesIcon name='clock' variation='primary' />
				<StatesTitle>Check back later</StatesTitle>
				<StatesSubtitle>something</StatesSubtitle>
				<StatesLink target='_blank' href='https://go.rocket.chat/i/omnichannel-docs'>
					Learn_more_about_business_hours
				</StatesLink>
			</States>
		</Box>
	);
};

export default RoomE2EEWaitingKeys;
