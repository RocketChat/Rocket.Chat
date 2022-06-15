import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const FilterDisplay = ({ users, room, startDate, endDate, t }) => (
	<Box display='flex' flexDirection='column' alignItems='stretch' withTruncatedText>
		<Box withTruncatedText>{users ? `@${users[0]} : @${users[1]}` : `#${room}`}</Box>
		<Box withTruncatedText>
			{startDate} {t('to')} {endDate}
		</Box>
	</Box>
);

export default FilterDisplay;
