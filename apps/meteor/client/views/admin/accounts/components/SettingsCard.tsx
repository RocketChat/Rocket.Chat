import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SettingsCardProps = {
	children: ReactNode;
};

const SettingsCard = ({ children }: SettingsCardProps) => (
	<Box
		backgroundColor='surface-light'
		borderWidth='default'
		borderColor='light'
		borderRadius='x8'
		display='flex'
		flexDirection='column'
		overflow='hidden'
	>
		{children}
	</Box>
);

export default SettingsCard;
