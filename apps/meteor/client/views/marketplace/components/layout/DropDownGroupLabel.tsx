import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type DropDownGroupLabelProps = {
	children: ReactNode;
};

/**
 * The caption above a group of options in a marketplace filter dropdown.
 */
const DropDownGroupLabel = ({ children }: DropDownGroupLabelProps) => (
	<Box paddingInline='x16' paddingBlockStart='x8' paddingBlockEnd='x4' fontScale='micro' textTransform='uppercase' color='default'>
		{children}
	</Box>
);

export default DropDownGroupLabel;
