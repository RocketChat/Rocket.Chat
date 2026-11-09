import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type RoomFilesListAreaProps = {
	id?: string;
	children: ReactNode;
};

/**
 * The area the files list fills, clipped so the list scrolls inside it, with 8px kept clear above and below.
 */
const RoomFilesListArea = (props: RoomFilesListAreaProps) => (
	<Box width='full' height='full' flexShrink={1} overflow='hidden' marginBlock='x8' {...props} />
);

export default RoomFilesListArea;
