import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type RoomBodyContentProps = {
	children: ReactNode;
};

/** The part of a room's body that holds its messages and its composer, filling the space left under the announcement. */
const RoomBodyContent = ({ children }: RoomBodyContentProps) => <Box className='main-content-flex'>{children}</Box>;

export default RoomBodyContent;
