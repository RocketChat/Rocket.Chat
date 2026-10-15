import type { RefAttributes } from 'react';
import { memo } from 'react';

import { Box, type BoxProps } from '../Box';

export type ContextualbarSectionProps = Omit<BoxProps, 'ref'> & RefAttributes<HTMLElement>;

function ContextualbarSection(props: ContextualbarSectionProps) {
	return (
		<Box
			rcx-vertical-bar__section
			padding={16}
			display='flex'
			alignItems='center'
			flexGrow={1}
			borderBlockEndWidth='default'
			borderBlockColor='extra-light'
			{...props}
		/>
	);
}

export default memo(ContextualbarSection);
