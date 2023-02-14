import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';

const CardCol: FC = ({ children }) => (
	<Box rcx-card-col display='flex' alignSelf='stretch' flexGrow={1} flexDirection='column' fontScale='c1'>
		{children}
	</Box>
);

export default CardCol;
