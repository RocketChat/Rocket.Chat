import { memo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ContextualbarSectionProps = ElementProps<HTMLElement>;

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
