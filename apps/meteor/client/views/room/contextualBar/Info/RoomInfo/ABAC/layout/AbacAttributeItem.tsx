import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AbacAttributeItemProps = {
	children: ReactNode;
};

/**
 * One attribute in the room's attribute list: its name above its values.
 */
const AbacAttributeItem = ({ children }: AbacAttributeItemProps) => (
	<Box is='li' marginBlock='x16'>
		{children}
	</Box>
);

export default AbacAttributeItem;
