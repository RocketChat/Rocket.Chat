import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type StatusBulletSlotProps = {
	children: ReactNode;
};

/**
 * Centres a status bullet in an icon-wide slot, so a label with a bullet lines up with a label with an icon.
 */
const StatusBulletSlot = ({ children }: StatusBulletSlotProps) => (
	<Box minWidth='x16' display='inline-flex' flexDirection='row' alignItems='flex-end' justifyContent='center'>
		{children}
	</Box>
);

export default StatusBulletSlot;
