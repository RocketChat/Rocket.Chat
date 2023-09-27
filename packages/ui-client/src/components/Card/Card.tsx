import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';

const Card: FC = (props) => (
	<Box borderRadius='x8' p={20} height='full' display='flex' flexDirection='column' bg='light' color='default' {...props} />
);

export default Card;
