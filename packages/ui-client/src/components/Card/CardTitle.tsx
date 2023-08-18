import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';

const CardTitle: FC = ({ children }) => (
	<Box mbe={12} fontScale='h4' color='default'>
		{children}
	</Box>
);

export default CardTitle;
